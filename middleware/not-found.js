const noLayout = '../views/layouts/nothing.ejs'
const {allPages} = require('../controllers/main')
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const notFound = async (req, res) =>  {

    const {is_user, is_admin} = await allPages(req, res)

    return res.render("main/404", {
        title: "404 Error",
        description: "",
        image_url: "",
        is_user, is_admin, stripePublickey
    }) 
}

module.exports = notFound
