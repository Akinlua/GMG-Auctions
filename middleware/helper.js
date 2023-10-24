const fs = require("fs");
const nodemailer = require("nodemailer");
const User = require("../model/user");

const pagination = async (result, count, req, res) => {
  let page = Number(req.query.page) || 1;
  let limit = Number(req.query.limit) || 12;

  // check for limit
  if (req.query.limit <= 0) limit = 5;

  // check for 0 or less pages
  if (req.query.page <= 0) page = 1;
  // check for last page
  if (req.query.page > Math.ceil(count / limit))
    page = Math.ceil(count / limit);

  let noOfPages = Math.ceil(count / limit);
  let skip = (page - 1) * limit;
  let startPoint = skip + 1;

  result = result.skip(skip).limit(limit);

  const modelinstances = await result;
  let endPoint = modelinstances.length + skip;
  if (modelinstances.length == 0) startPoint = 0;
  // next page
  const nextPage = page + 1;
  // prev page
  let prevPage = page - 1;
  let hasNextPage = true;
  let hasPrevPage = true;
  if (nextPage > Math.ceil(count / limit)) {
    hasNextPage = false;
  }
  if (prevPage == 0) {
    hasPrevPage = false;
  }

  return {
    modelinstances: modelinstances,
    noOfPages: noOfPages,
    hasNextPage: hasNextPage,
    hasPrevPage: hasPrevPage,
    nextPage: nextPage,
    prevPage: prevPage,
    page: page,
    count: count,
    startPoint: startPoint,
    endPoint: endPoint,
  };
  // END PAGINATION
};

const deleteFile = async (filePath) => {
  // Use the fs.unlink method to delete the file
  const new_filepath = "public\\" + filePath;
  if (fs.existsSync(new_filepath)) {
    fs.unlink(new_filepath, (err) => {
      if (err) {
        console.error(err);
        console.log("Error deleting the file");
      }
    });
  }
};

const changeToInt = async (value, req, res) => {
  value = await Number(value);
  if (isNaN(value)) {
    value = -1234567890987654345678;
  }

  return value;
};

const formatDate = (date) => {
  const inputDate = new Date(date);
  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = inputDate.toLocaleDateString("en-US", options);

  return formattedDate;
};

const getDate = async () => {
  const timestamp = Date.now();
  const currentDate = new Date(timestamp);

  const monthnames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = monthnames[currentDate.getMonth()];
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();

  const formattedDate = `${month} ${day}, ${year}, ${hours}:${minutes}`;

  return formattedDate;
};

const generateToken = (length) => {
  const charset = "ABCDEFGHKLMNPQRSUVWTZabcdefghklmnpqrtuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    token += charset[randomIndex];
  }

  return token;
};

// send email
async function sendNotification(email, owner, text, title) {
  // console.log(email, text)

  // Set up email content
  const htmlContent = `

        <h3>Hello ${owner}, </h3> <br>

        <p>${text}</p>

        <p>Sincerely,</p>
        <p>gmg- Auctions.</p>
        
    `;

  // send the reset email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "info.tekcify",
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "info.tekcify@gmail.com",
    to: email,
    subject: title,
    html: htmlContent,
  };

  const transport = await transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent");
    }
  });

  return { transport: transport };
}

//resetuser login token at the end of each day
const resetToken = async () => {
  console.log("yes");
  const users = await User.find({});
  users.forEach(async (user) => {
    user.resetToken = undefined;
    await user.save();
  });
};

module.exports = {
  pagination,
  deleteFile,
  changeToInt,
  formatDate,
  getDate,
  generateToken,
  sendNotification,
  resetToken,
};
