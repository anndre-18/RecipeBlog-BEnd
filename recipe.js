const { log } = require("console");
const express = require("express");
const mongoose = require("mongoose");
const app = express();  
const { v4 : uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const cors = require('cors')
app.use(express.json());
app.use(cors())

//local host mongodb compass
mongoose.connect("mongodb://localhost:27017/recipesDB").then(()=>{
    console.log("Connected to MongoDB")
})

//atlas connection string
// mongoose.connect("mongodb+srv://anndre-18:sherrlyn31@cluster0.5afem.mongodb.net/recipeDB")//returns a promise
// .then(()=>{
//     console.log("Connected to MongoDB")
// })

const userSchema= new mongoose.Schema({
    id:{type:String,required:true,unique:true},
    uname:{type:String,required:true,unique:true},
    password:{type:String,required:true}

},{timestamps:true})

const User = mongoose.model("User",userSchema);

const recipeSchema = new mongoose.Schema({
    id:{type:String,required:true,unique:true},
    title:{type:String,required:true},
    title:{type:String,required:true} ,
    ingredients:{type:String,required:true},
    instruction:{type:String,required:true}
    
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

//search recipes




//add new recipe //need authentication [need to login]
app.post("/api/recipes" ,async(req,res)=>{
    const{title,time,ingredients,instruction} = req.body;
    try{
        if(!title||!ingredients||!instruction||!time){
            res.status(400).json({message:"Please fill all the required fields"})
            return
        }
        const newRecipe=new Recipe({
            id:uuidv4(),
            title:title,
            time,
            ingredients,
            instruction
        })
        const savedRecipe = await newRecipe.save()
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
app.put("/api/recipes/:id", async (req,res)=>{
    const { id }=req.params;
    const { title, ingredients, instruction,image } = req.body;
    try{
        if(!title||!ingredients||!instruction||!image){
            res.status(404).json({message:"Provide all the required fields"})
            return
        }
        const updatedRecipe = await Recipe.findOneAndUpdate(
            { id: id}, 
            { title, ingredients, instruction,image }, 
            { new: true }
        );
        if(!updatedRecipe){
             res.status(404).json({message:"Recipe not found"})
             return
        }
        console.log(updatedRecipe)
        res.status(200).json({message:"Recipe update success"})
    }catch(error){
        console.error(error)
        res.status(500).json({message:"Intenl Server Error"})
        
    }
});



//login/register

app.post("/api/register",async (req,res)=>{
    const {uname,password} = req.body;
    try{
        if(!uname||!password){
            return res.status(400).json({message:"Fill all the required fields"})
        }
        const existingUser = await User.findOne({uname})
        if(existingUser){
            console.log("user already exist")
            return res.status(404).json({message:"Username already exit"});
        }   
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser =new User({
            id:uuidv4(),
            uname,password:hashedPassword
        })
        await newUser.save()
        let token =jwt.sign({uname,id:newUser.id},"my_secret",{expiresIn : '1h'})
        console.log("User registered successfully:", newUser);
        return res.status(200).json({token,user:newUser})
    }catch(error){
        res.status(500).json({message:"Internal server error"})
        console.error(error)
    }
})


app.post("/api/login",async (req,res)=>{
    const{uname,password}=req.body;
    try{
        if(!uname||!password){
            return res.status(400).json({message:"Fill all the required fields"})
        }

        const existingUser = await User.findOne({uname})
        if(!existingUser){
            return res.status(400).json({message :"Not an Existing User / Invaild username"})
        }

        const validPassword = await bcrypt.compare(password,existingUser.password)
        if(!validPassword){
            return res.status(400).json({message:"Invaild Password"})
        }
        let token = jwt.sign({id : existingUser.id},"my_secret",{expiresIn : '1h'})
        res.status(200).json({token,user:existingUser})
        console.log("login succes")
    }catch(error){
        res.status(500).json({message:"Internal server error"})
        console.error(error)
    }
})


app.listen(3000,()=>{
    console.log("Server is running");
});