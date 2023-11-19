const Item = require("../model/item")
const User = require('../model/user.js')
const Comment = require('../model/comments')
const path_ = require('path')
const {pagination, changeToInt, deleteFile, getDate, generateUniqueID} = require('../middleware/helper')
const noLayout = '../views/layouts/nothing.ejs'
const jwt = require('jsonwebtoken')
const { LENGTH_REQUIRED } = require("http-status-codes")
const {auth} = require('../middleware/authentication.js')

const jwtSecret = process.env.JWT_SECRET

const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey);


const url = 'https://gmgauctions.co.uk'


const allPages = async (req, res) => {

    let is_user = false
    let is_admin = false
    try{
        const token = req.cookies.token;
        if(token) {
            is_user = true
            const decoded = jwt.verify(token, jwtSecret);
            //dont just find by Id, but by password
            const user = await User.findById(decoded.userId)
            if(user) {
                if(user.admin == true) is_admin = true
            }
        }
        return {is_user: is_user, is_admin}
    }  catch (error) {
        return {is_user: false, is_admin}
    }
    
    

}


const payPage = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const {id} = req.params

    const item = await Item.findById(id).select('name pic_path description ownerId paid')
    if(!item){
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    if(req.userId != item.ownerId){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    if(item.paid == true){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: Payment Already made", statusCode: 401})
    }

    let error, cancel, success = ''
    if(req.query.error) error = req.query.error
    if(req.query.cancel) cancel = req.query.cancel
    if(req.query.success) success = req.query.success


    res.render('main/pay', {
        title: "Payment",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey,
        item, success, error, cancel
    })
}


const bidPage = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const {id} = req.params

    const item = await Item.findOne({_id: id, sold: false})
    if(!item){
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    if(req.userId == item.ownerId){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: You can't bid on your item", statusCode: 401})
    }
    // if already bidded not allowed again
    const user = await User.findById(req.userId)
    var bidded = false
    item.verified_Bidders.forEach(verified => {
        if(verified.bider == user.username){
            return bidded = true
        }
     });
    if(bidded == true)  return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: Can only bid once", statusCode: 401})

    let error, cancel, success = ''
    if(req.query.error) error = req.query.error
    if(req.query.cancel) cancel = req.query.cancel
    if(req.query.success) success = req.query.success


    res.render('main/bid', {
        title: "Bid",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey,
        item, success, error, cancel
    })
}

const bid = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const { amount, token, name, email } = req.body;
    if(!email){
        return res.redirect(`/bid/${req.params.id}?error=Provide Email`);
    }

    if(!token){
        return res.redirect(`/bid/${req.params.id}?error=Fill in the card details`);
    }

    try {

        const {id} = req.params
        const item = await Item.findOne({_id: id, sold: false})
        if(!item){
            return res.render('main/404', {
                title: "404 Error",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }
        if(req.userId == item.ownerId){
            return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: You can't bid on your item", statusCode: 401})
        }
    
        // if already bidded not allowed again
        const user__ = await User.findById(req.userId)
        var bidded = false
        item.verified_Bidders.forEach(verified => {
            if(verified.bider == user__.username){
                return bidded = true
            }
         });
        if(bidded == true)  return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: Can only bid once", statusCode: 401})

         // hold payment
         const hold = await stripe.charges.create({
            amount: 19500,
            currency: 'GBP',
            source: token,
            description: `Hold £195 for displaying ${name}'s item for auctioning`,
            capture: false,
            receipt_email: email,
            metadata: {
                name: name,
            },
        });

        if(!hold){
            error = "Make sure to fill in the card details"
            return res.redirect(`/bid/${req.params.id}?error=${error}`);
        }

        const user = await User.findById(req.userId);
        // upate item
        const user_ = {
            bider : user.username,
            bider_email: user.email,
            biderId : user.id,
            bider_holdId : hold.id,
        }

        item.verified_Bidders.push(user_);
        await item.save()
    
        res.redirect(`/item/${item._id}#bid_now`);
    } catch (err) {
      console.error(err);
      res.redirect(`/bid/${req.params.id}?error=An error Occurred.`);
    }
}

// const charg =  async (req, res) => {
//     try{
//         const {is_user, is_admin} = await allPages(req, res)
        
//         const {id} = req.params
//         const item = await Item.findById(id).select('name pic_path description ownerId paid')
//         if(!item){
//             return res.render('main/404', {
//                 title: "404 Error",
//                 description: "",
//                 image_url: "",
//                 is_user, is_admin, stripePublickey
//             })
//         }

//         if(req.userId != item.ownerId){
//             return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
//         }

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: [
//               {
//                 price_data: {
//                   currency: 'GBP',
//                   product_data: {
//                     name: item.name,
//                   },
//                   unit_amount: 2500, // 25.00 euros Amount in cents
//                 },
//                 quantity: 1,
//               },
//             ],
//             mode: 'payment',
//             success_url: `${url}/pay/${item._id}?success=Your Payment has been successful, wait for admin to approve your item?sessionId=${session.id}`,
//             cancel_url: `${url}/pay/${item._id}?cancel="Payment Cancelled."`,
//           });
        
//         console.log(session)
//         item.paidId = session.id
//         await item.save()

//         res.json({ id: session.id });
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ error: error.message });
//     }
    
    
// }

const charge = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const { amount, token, name, email } = req.body;
    if(!email){
        return res.redirect(`${url}/pay/${req.params.id}?error=Provide Email`);
    }

    if(!token){
        return res.redirect(`${url}/pay/${req.params.id}?error=Fill in the card details`);
    }

    try {

        const {id} = req.params
        const item = await Item.findById(id).select('name pic_path description ownerId paid')
        if(!item){
            return res.render('main/404', {
                title: "404 Error",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }

        if(req.userId != item.ownerId){
            return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
        }

        if(item.paid == true){
            return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: Payment Already made", statusCode: 401})
        }
    
        // make payment
        const charge = await stripe.charges.create({
            amount: 2500,
            currency: 'GBP',
            source: token,
            description: `Charge £25 for displaying ${item.name}'s item for auctioning`,
            receipt_email: email,
            metadata: {
                name: name,
            },
        });

        if(charge.paid == true & charge.status == 'succeeded'){
            item.paid = true
            item.chargeId = charge.id
            item.receipturl = charge.receipt_url
            await item.save()
        } else {
            res.redirect(`${url}/pay/${req.params.id}?error=Payment Failed`);
        }
    
        res.redirect(`/user-items?message=Payment Successful for ${item.name}`);
    } catch (err) {
      console.error(err);
      res.redirect(`${url}/pay/${req.params.id}?error=An error Occurred.`);
    }
}

// const purchase = async (req,res) => {
  
//     const prop_id = req.body.prop_id
//     const property = await Property.findById(prop_id)
//     if(!property) {
//         return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: 'The property you are trying to purchase is not found'})
//     }
//     const total_ = property.cost
//     const total =  total_.toFixed(2) * 100 //cents
//     const payment = await stripe.charges.create({
//         amount: total,
//         source: req.body.stripeTokenId,
//         description: `Payment for ${property.name} Rent`,
//         currency: 'usd'
//     })
//     console.log('charge succesful')
    
//     //check if all went well prev before changing to Paid

//     if(payment) {
//         //change the property to paid
//         property.status = "Paid"
//         //update property dateOfPayment
//         const currentTime = moment().format("YYYY-MM-DD"); //find the date when paid, moment date
//         property.dateOfPayment = currentTime
//         await property.save()

//         //create notification that payment has been made
//         const text = `You have just paid ${total} for ${property.name} Rent`
//         const title = `Payment for ${property.name} Rent`
//         const notice = await Notice.create({owner: property.owner, message: text, title: title})


//     } else {
//         return res.status(500).json({message: "Error in payment"})
//     }
    
//     res.status(200).json({message: "Done"})//DONT CHANGE WHILE CHANGING OTHER ERROR RESPONSE
    
            
// }


const home = async (req, res) => {

    const {is_user, is_admin} = await allPages(req, res)

    res.render('main/home',{
        title: "Home",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey
    })
}

const itemForm = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    let error = ""
    res.render('main/post-item',{error: error,
        title: "Post Item Form",
        description: "",
        image_url: "",
        is_user, is_admin, stripePublickey
    })
}

const deleteCollectedFile = async (files) => {
    if(files.file){
        const { path } = files.file[0];
        const newPath = path_.join(...path.split('\\').slice(1))//remove public, cos delete file add public back
        await deleteFile(newPath)
    }

    if(files.imagesArray){
        const images = files.imagesArray;
        images.forEach(async image => {
            const new_path = path_.join(...image.path.split('\\').slice(1))
            await deleteFile(new_path)
        });
    }
}

// const createItem = async (req, res) => {
//     const {is_user, is_admin} = await allPages(req, res)

//     try{
//         const {name, cost, description, checkBox} = req.body
 
//         //must agree to the form- checkBox checked
//         let error = ""
//         if(checkBox != 'on'){
//             //delete any image collected
//             await deleteCollectedFile(req.files)
//             error = "Make sure you agree to the consent form by checking the box below"
//             return  res.render('main/post-item',{error: error,
//                 title: "Post Item Form",
//                 description: "",
//                 image_url: "",
//                 is_user, is_admin, stripePublickey
//             })
//         }
//         if(!req.files.file){
//             await deleteCollectedFile(req.files)
//             error = "Make sure to upload the neccessary files"
//             return  res.render('main/post-item',{error: error,
//                 title: "Post Item Form",
//                 description: "",
//                 image_url: "",
//                 is_user, is_admin, stripePublickey
//             })
//         }
    
//         // Access the uploaded file details
//         const { originalname, filename, path } = req.files.file[0];
    
//         const newPath = path_.join(...path.split('\\').slice(1))
    
//         // Access the uploaded file details
//         const images = req.files.imagesArray;
//         let imagesPaths = []
//         let imagesfilenames = []
//         let imagesoriginal = []
    
//         if(images){
//             for (const image of images) {
//                 const new_path = path_.join(...image.path.split('\\').slice(1))
//                 imagesPaths.push(new_path)
//                 imagesoriginal.push(image.originalname)
//                 imagesfilenames.push(image.filename)
//             }    
//         }
        
//         const user = await User.findById(req.userId)
//         const item = await Item.create({
//              owner: user.username, ownerId: user._id, 
//              name, cost, description, 
//              agreed_consent: true, 
//              pic_originalname: originalname, 
//              pic_filename: filename, pic_path: newPath,
//              gallery_paths: imagesPaths, 
//              gallery_originalnames: imagesoriginal,
//              gallery_filenames: imagesfilenames
//             })
    
//         res.redirect(`/pay/${item._id}`)
//     } catch(error) {
//         console.log(error)
//         //delete any image collected
//         await deleteCollectedFile(req.files)

//         error = "An error Occurred: Make sure to follow the instructions"
//         return  res.render('main/post-item',{error: error,
//             title: "Post Item Form",
//             description: "",
//             image_url: "",
//             is_user, is_admin, stripePublickey
//         })
//     }

   
// }

const new_createItem = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    try{
        const {name, cost, description, checkBox, token} = req.body
 
        if(!token){
            let error = "Make sure to fill in the card details"
            return  res.render('main/post-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }
        //must agree to the form- checkBox checked
        let error = ""
        if(checkBox != 'on'){
            error = "Make sure you agree to the consent form by checking the box below"
            return  res.render('main/post-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }
        if(!req.files.file){
            error = "Make sure to upload the neccessary files"
            return  res.render('main/post-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }

        // Access the uploaded file details
        const { originalname, buffer, mimetype } = req.files.file[0];
        const image_url = `data:${mimetype};base64,${buffer.toString('base64')}`;

        // Access the uploaded file details
        const images = req.files.imagesArray;
        let imagesoriginal = []
        let imagesPaths = []

        if(images){
            for (const image of images) {
                const image_url = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
                imagesPaths.push(image_url)
                imagesoriginal.push(image.originalname)
            }    
        }
        
        const user = await User.findById(req.userId)

        // create hold on the card
        
        // hold payment
        const hold = await stripe.charges.create({
            amount: 19500,
            currency: 'GBP',
            source: token,
            description: `Hold £195 for displaying ${name}'s item for auctioning`,
            capture: false,
            receipt_email: user.email,
            metadata: {
                name: user.username,
            },
        });

        if(!hold){
            error = "Make sure to fill in the card details"
            return  res.render('main/post-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey
            })
        }


        // generate unique ID
        var unique_id = await generateUniqueID()

        // check if id isnt present
        var check_uniqueId = await Item.find({id: unique_id})

        while(check_uniqueId.length > 0){
            unique_id = await generateUniqueID()
            check_uniqueId = await Item.find({id: unique_id})
        }

        const item = await Item.create({
            id: unique_id,
             owner: user.username, ownerId: user._id, 
             name, cost, description, 
             agreed_consent: true, 
             pic_originalname: originalname,
             pic_path: image_url,
             gallery_originalnames: imagesoriginal,
             gallery_paths: imagesPaths,
             holdId: hold.id
        })   

        res.redirect(`/pay/${item._id}`)
    } catch(error) {
        console.log(error)
        error = "An error Occurred: Make sure to follow the instructions"
        return  res.render('main/post-item',{error: error,
            title: "Post Item Form",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

   
}

const editItem = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const {id} = req.params
    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    //only owner can edit
    if(req.userId != item.ownerId){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    if(item.status == 'Approved'){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action: Editing not allowed again", statusCode: 401})
    }

    let error = ""
    res.render('main/edit-item',{error: error,
        title: "Edit Item",
        description: "",
        image_url: "",
        is_user, is_admin, stripePublickey,
        item
    })
}

const editItemPatch = async (req, res) => {

    const {is_user, is_admin} = await allPages(req, res)
    const {id} = req.params
    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        await deleteCollectedFile(req.files)
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    //only owner can edit
    if(req.userId != item.ownerId){
        await deleteCollectedFile(req.files)
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    if(item.status == 'Approved'){
        await deleteCollectedFile(req.files)
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    try{
        const {name, cost, description, checkBox} = req.body

        //must agree to the form- checkBox checked
        let error = ""
        if(checkBox != 'on'){
            await deleteCollectedFile(req.files)
            error = "Make sure you agree to the consent form by checking the box below"
            return  res.render('main/edit-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey, item
            })
        }
    
        //update item
        const new_item = await Item.findOneAndUpdate({_id: id}, {
            name,
            cost,
            description, agreed_consent: true
        }, {new: true, runValidators: true})

        if(req.files.file){

            //remove previous file
            const item_ = await Item.findOne({_id: req.params.id})
            if(item_.pic_path) await deleteFile(item_.pic_path)

            // Access the uploaded file details
            const { originalname, filename, path } = req.files.file[0];
            const newPath = path_.join(...path.split('\\').slice(1))
    
            const item = await Item.findById(id)
            item.pic_originalname = originalname
            item.pic_filename = filename
            item.pic_path = newPath
            await item.save()
        }

        if(req.files.imagesArray){

            //remove previous files
            const item_ = await Item.findOne({_id: req.params.id})
            if(item_.gallery_paths.length > 0){
                item_.gallery_paths.forEach(async path => {
                    await deleteFile(path)
                });
            }

            const images = req.files.imagesArray;
            let imagesPaths = []
            let imagesfilenames = []
            let imagesoriginal = []

            for (const image of images) {
                const new_path = path_.join(...image.path.split('\\').slice(1))
                imagesPaths.push(new_path)
                imagesoriginal.push(image.originalname)
                imagesfilenames.push(image.filename)
            }    

            const item = await Item.findById(id)
            item.gallery_originalnames = imagesoriginal
            item.gallery_filenames = imagesfilenames
            item.gallery_paths = imagesPaths
            await item.save()
        }
    
        res.redirect(`/user-items`)

    } catch(error) {
        await deleteCollectedFile(req.files)
        console.log(error)
        error = "An error Occurred: Make sure to follow the instructions"
        return  res.render('main/edit-item',{error: error,
            title: "Edit Item",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey,
            item
        })
    }
}

const new_editItemPatch = async (req, res) => {

    const {is_user, is_admin} = await allPages(req, res)
    const {id} = req.params
    const item = await Item.findOne({_id: req.params.id})
    if(!item){
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    //only owner can edit
    if(req.userId != item.ownerId){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    if(item.status == 'Approved'){
        return res.render('admin/error-500',{layout: noLayout, name: "Unauthorized", message: "You are not allowed to perform this action", statusCode: 401})
    }

    try{
        const {name, cost, description, checkBox} = req.body

        //must agree to the form- checkBox checked
        let error = ""
        if(checkBox != 'on'){
            error = "Make sure you agree to the consent form by checking the box below"
            return  res.render('main/edit-item',{error: error,
                title: "Post Item Form",
                description: "",
                image_url: "",
                is_user, is_admin, stripePublickey, item
            })
        }
    
        //update item
        const new_item = await Item.findOneAndUpdate({_id: id}, {
            name,
            cost,
            description, agreed_consent: true
        }, {new: true, runValidators: true})

        if(req.files.file){
            // Access the uploaded file details
            const { originalname, buffer, mimetype } = req.files.file[0];
            const image_url = `data:${mimetype};base64,${buffer.toString('base64')}`;

            const item = await Item.findById(id)
            item.pic_path = image_url
            item.pic_originalname = originalname
            await item.save()
        }

        if(req.files.imagesArray){

            const images = req.files.imagesArray;
            let imagesoriginal = []
            let imagesPaths = []

            for (const image of images) {
                const image_url = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
                imagesPaths.push(image_url)
                imagesoriginal.push(image.originalname)
            }    

            const item = await Item.findById(id)
            item.gallery_originalnames = imagesoriginal
            item.gallery_paths = imagesPaths
            await item.save()
        }
    
        res.redirect(`/user-items`)

    } catch(error) {
        console.log(error)
        error = "An error Occurred: Make sure to follow the instructions"
        return  res.render('main/edit-item',{error: error,
            title: "Edit Item",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey,
            item
        })
    }
}



//read all items for all users
const readItems = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    let search= ''
    let AllItems;
    if(req.query.search){
        search = req.query.search
        let searchValue = await changeToInt(search)
        let result = Item.find({
            sold: false,breached: false, status: 'Approved',
            $or: [
                {name: {$regex: search, $options: 'i'}},
                {cost: searchValue},
                {Bid_price: searchValue},
            ]
        }).select('name cost pic_path Bid_price')
        result = result.sort('-createdAt')
        const count = await Item.find({
            sold: false,breached: false, status: 'Approved',
            $or: [
                {name: {$regex: search, $options: 'i'}},
                {cost: searchValue},
                {Bid_price: searchValue},
            ]
        }).count()
        const {modelinstances, hasNextPage, nextPage, prevPage, hasPrevPage, page, noOfPages, startPoint, endPoint} = await pagination(result,count, req, res)
        AllItems = await modelinstances
        res.render('main/items', {AllItems, hasNextPage, nextPage, prevPage, hasPrevPage, page, noOfPages, search, count, startPoint, endPoint,
            title: "Items search",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    } else {
        let result = Item.find({sold: false,breached: false, status: 'Approved'}).select('name cost pic_path Bid_price')
        result = result.sort('-createdAt')
        const count = await Item.find({sold: false,breached: false, status: 'Approved'}).count()
        const {modelinstances, hasNextPage, nextPage, prevPage, hasPrevPage, page, noOfPages, startPoint, endPoint} = await pagination(result,count, req, res)
        AllItems = await modelinstances
        res.render('main/items', {AllItems, hasNextPage, nextPage, prevPage, hasPrevPage, page, noOfPages, search, count, startPoint, endPoint,
            title: "Items",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    
}

const search = async (req, res) => {
    const {search} = req.body
    res.redirect(`/items?search=${search}`)
}

//read items for a particular user
const readItems_User = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const AllItems_user = await Item.find({ownerId: req.userId})

    let message = ''
    if(req.query.message) message = req.query.message
    
    res.render('main/user-items', {
        AllItems_user,
        title: "Dashboard",
        description: "",
        image_url: "",
        is_user, is_admin, stripePublickey,
        message
    })
}

const EachItem = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)

    const item = await Item.findOne({_id: req.params.id, agreed_consent: true, breached: false, status: 'Approved' })
    if(!item) {
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    // other items by same owner
    const OtherItems = await Item.find({owner: item.owner, _id: {$ne: req.params.id}, agreed_consent: true, breached: false, status: 'Approved'}).select('name _id')
    const item_url = `${url}/item/${item._id}`
    let error = ''
    if(req.query.error) error = req.query.error

    let limit = 5
    if(req.query.limit) limit = Number(req.query.limit)
    //get all associated comment
    const count = await Comment.find({itemId: item._id}).count()
    const comments = await Comment.find({itemId: item._id}).limit(limit).sort('-createdAt')

    // send user
    const userId = await auth(req, res)
    const user = await User.findById(userId)
    //check if user is verified
    var bidded = false
    item.verified_Bidders.forEach(verified => {
        if(verified.bider == user.username){
            return bidded = true
        }
     });

    //  console.log(item.sold, user.admin)
    res.render('main/single-item', {
        item, OtherItems, item_url,
        title: item.name,
        description: item.description,
        image_url: url + '/' + item.pic_path,
        is_user, is_admin, stripePublickey, error,
        comments, limit, count, user, bidded
    })
}

const EachItemGallery = async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)
    const item = await Item.findOne({_id: req.params.id, agreed_consent: true, breached: false, status: 'Approved' }).select('gallery_paths name')
    if(!item) {
        return res.render('main/404', {
            title: "404 Error",
            description: "",
            image_url: "",
            is_user, is_admin, stripePublickey
        })
    }

    res.render('main/item-gallery', {
        item,
        title: item.name + '\'s Gallery',
        description: item.description,
        image_url: url + '/' + item.pic_path,
        is_user, is_admin, stripePublickey
    })
}

const about= async (req, res) => {
    const {is_user, is_admin} = await allPages(req, res)
    res.render('main/about',{
        title: "About",
        description: "",
        image_url: "",
        is_user,
        is_admin, stripePublickey
    })

}


const postComment = async (req, res) => {
    const {id} = req.params
    const item = await Item.findById(id)
    if(!item){
        return res.render('admin/error-404', {layout: noLayout})
    }

    const {message} = req.body
    if(!message){
        res.redirect(`/item/${item._id}?error=Make sure to fill the message body`)
    }
    const user = await User.findById(req.userId)
    const date = await getDate()

    const comment = await Comment.create({
        owner: user.username,
        ownerId: req.userId,
        itemId: item._id,
        message, date
    })

    res.redirect(`/item/${item._id}#comment`)
}
module.exports = {
    // createItem,
    readItems,
    readItems_User,
    EachItem,
    home,
    itemForm,
    search,
    EachItemGallery,
    allPages, charge,
    payPage, editItem,
    editItemPatch,
    about, postComment,
    new_createItem,
    new_editItemPatch,
    url,
    bidPage, bid
}