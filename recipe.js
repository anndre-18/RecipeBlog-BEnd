const { log } = require("console");
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();  
const { v4 : uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const cors = require('cors')
const bodyParser=require('body-parser');
const nodemailer = require("nodemailer");
app.use(express.json());
app.use(cors({
  origin: "https://recipeblog-fend.onrender.com",
  credentials: true
}));
app.use(bodyParser.json());

//local host mongodb compass
// mongoose.connect("mongodb://localhost:27017/recipesDB").then(()=>{
//     console.log("Connected to MongoDB")
// })

// atlas connection string
// Overriding Node's internal DNS servers to fix "querySrv ECONNREFUSED" on Windows
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGO_URI)//returns a promise
.then(()=>{
    console.log("Connected to MongoDB Atlas")
})
.catch((error)=>{
    console.error("Error connecting to MongoDB Atlas:", error.message)
})

const userSchema= new mongoose.Schema({
    id:{type:String,required:true,unique:true},
    uname:{type:String},
    email:{type:String, unique:true, sparse:true},
    // password:{type:String},
    otp: {type:String},
    otpExpiry: {type:Date},
    favorites: [{type:String}]
},{timestamps:true})

const User = mongoose.model("User",userSchema);



const recipeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    recipeName: { type: String, required: true },
    timeRequired: { type: String, required: true },
    ingredients: { type: String, required: true },
    description: { type: String, required: true },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
                return Array.isArray(arr) && arr.length >= 1 && arr.length <= 3;
            },
            message: "Images must contain between 1 and 3 URLs"
        }
    },
    createdAt: { type: Date, default: Date.now }
});

const Recipe = mongoose.model("Recipe",recipeSchema);


//get all recipes 
app.get("/api/recipes",async(req,res)=>{
    try{
        const recipes=await Recipe.find();
        if(!recipes){
            res.status(404).send({message : "Sorry , No Recipe Found"});
            return;
        }
        res.status(200).json(recipes);
        console.log(recipes)
    }catch(error){
        res.status(500).json({message:"Internal Sever Error"})
    }
});

//add new recipe //need authentication [need to login]
app.post("/api/recipes", async (req, res) => {
    const { recipeName, timeRequired, ingredients, description, images, createdAt } = req.body;
    try{
        if (!recipeName || !timeRequired || !ingredients || !description) {
            res.status(400).json({ message: "Please fill all required text fields" });
            return;
        }

        if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
            res.status(400).json({ message: "Please provide 1 to 3 image URLs" });
            return;
        }

        const newRecipe = new Recipe({
            id: uuidv4(),
            recipeName,
            timeRequired,
            ingredients,
            description,
            images,
            createdAt: createdAt ? new Date(createdAt) : new Date()
        });

        const savedRecipe = await newRecipe.save();
        res.status(200).json(savedRecipe);

    }
    catch(error){
        res.status(500).json({message:"Internal server error"})
        console.error(error);
    }
});

app.delete("/api/recipes/:id",async (req, res) => {
        const { id } = req.params;
        try {
            const deleteRecipe = await Recipe.findOneAndDelete({ id: id });
            if(!deleteRecipe){
                res.status(404).json({message : "Recipe not found"})
                return
            }
            console.log(deleteRecipe)
            res.status(200).json({message:"Recipe Deleted Success "})
            
        }catch(error){
            res.status(500).json({message:"Internal Error"})
        }
    
    })

//edit recipe by id
app.put("/api/recipes/:id", async (req, res) => {
    const { id } = req.params;
    const { recipeName, timeRequired, ingredients, description, images } = req.body;
    try {
        if (!recipeName || !timeRequired || !ingredients || !description) {
            res.status(400).json({ message: "Provide all required text fields" });
            return;
        }
        if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
            res.status(400).json({ message: "Provide 1 to 3 image URLs" });
            return;
        }

        const updatedRecipe = await Recipe.findOneAndUpdate(
            { id: id },
            { recipeName, timeRequired, ingredients, description, images },
            { new: true }
        );

        if (!updatedRecipe) {
            res.status(404).json({ message: "Recipe not found" });
            return;
        }
        console.log(updatedRecipe);
        res.status(200).json(updatedRecipe);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});



//login/register

// app.post("/api/register",async (req,res)=>{
//     const {uname,password} = req.body;
//     try{
//         if(!uname||!password){
//             return res.status(400).json({message:"Fill all the required fields"})
//         }
//         const existingUser = await User.findOne({uname})
//         if(existingUser){
//             console.log("user already exist")
//             return res.status(404).json({message:"Username already exit"});
//         }   
//         const hashedPassword = await bcrypt.hash(password,10)
//         const newUser =new User({
//             id:uuidv4(),
//             uname,password:hashedPassword
//         })
//         await newUser.save()
//         let token =jwt.sign({uname,id:newUser.id},"my_secret",{expiresIn : '1h'})
//         console.log("User registered successfully:", newUser);
//         return res.status(200).json({token,user:newUser})
//     }catch(error){
//         res.status(500).json({message:"Internal server error"})
//         console.error(error)
//     }
// })


// app.post("/api/login",async (req,res)=>{
//     const{uname,password}=req.body;
//     try{
//         if(!uname||!password){
//             return res.status(400).json({message:"Fill all the required fields"})
//         }

//         const existingUser = await User.findOne({uname})
//         if(!existingUser){
//             return res.status(400).json({message :"Not an Existing User / Invaild username"})
//         }

//         const validPassword = await bcrypt.compare(password,existingUser.password)
//         if(!validPassword){
//             return res.status(400).json({message:"Invaild Password"})
//         }
//         let token = jwt.sign({id : existingUser.id},"my_secret",{expiresIn : '1h'})
//         res.status(200).json({token,user:existingUser})
//         console.log("login succes")
//     }catch(error){
//         res.status(500).json({message:"Internal server error"})
//         console.error(error)
//     }
// })

// --- OTP Authentication System ---
app.post("/api/send-email",(req,res)=>{
    const {subject,recipient} =req.body;
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER ,
        pass: process.env.EMAIL_PASS 
    }
});




app.post("/api/send-otp", async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
        
        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({
                id: uuidv4(),
                email: email,
                uname: email.split("@")[0] + "_" + Math.floor(Math.random()*1000),
                otp,
                otpExpiry
            });
        } else {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }
        await user.save();
        
        console.log(`[OTP] Sent to ${email}: ${otp}`); // For local testing
        
        try {
            await transporter.sendMail({
                from: `"Tasty Trails" <${process.env.EMAIL_USER}>` || '"Tasty Trails - Recipe Blog" <no-reply@recipeapp.com>',
                to: email,
                subject: "Your Verify Code",
                text: `Your OTP for Recipe App is: ${otp}. It will expire in 5 minutes.`
            });
        }catch (mailErr) {
                console.error("MAIL ERROR:", mailErr);
         }
        // catch (mailErr) {
        //     console.log("Email sending failed (likely missing credentials), but OTP is logged above.");
        // }

        transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});
        
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

    console.log("EMAIL:", process.env.EMAIL_USER);
    console.log("PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");
});

app.post("/api/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
}

const user = await User.findOne({ email });
if (!user) {
    return res.status(400).json({ message: "User not found" });
}

// Check expiry first
if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP has expired" });
}

// Compare safely
if (user.otp?.toString().trim() !== otp.toString().trim()) {
    return res.status(400).json({ message: "Invalid OTP" });
}
        
        // Successful OTP verify, clear the OTP
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        
        let token = jwt.sign({ id: user.id }, "my_secret", { expiresIn: '1h' });
        
        console.log("OTP Login Success for", email);
        res.status(200).json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// --- Favorites Endpoints ---
app.post("/api/favorites/toggle", async (req, res) => {
    const { userId, recipeId } = req.body;
    try {
        if (!userId || !recipeId) return res.status(400).json({ message: "userId and recipeId required" });
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const index = user.favorites.indexOf(recipeId);
        if (index === -1) {
            user.favorites.push(recipeId);
        } else {
            user.favorites.splice(index, 1);
        }
        await user.save();
        res.status(200).json({ message: "Favorites updated", favorites: user.favorites });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/api/users/:userId/favoriteIds", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user.favorites || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/api/users/:userId/favorites", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findOne({ id: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        const favoriteRecipes = await Recipe.find({ id: { $in: user.favorites || [] } });
        res.status(200).json(favoriteRecipes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// const PORT = process.env.PORT || 5000;
app.listen(REACT_APP_API_URL, () => {
  console.log(`Server running on port ${REACT_APP_API_URL}`);
});