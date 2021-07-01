const express = require("express");
const app = express();
const mongodb = require("mongodb");
require('dotenv').config()
const URL= process.env.URL
const DB = process.env.DB
const bcrypt = require("bcrypt")
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("bson");
const nodemailer=require('nodemailer')
app.use(cors())
app.use(express.json())

let students =[]
const uniqueString =  (email)=>{
    const len=8
    let unqstr =''+email
    for(let i=0;i<len;i++){
        const ch=Math.floor((Math.random()*10)+1)
        unqstr+=ch
    }
   
    return unqstr
}

app.post("/register/student", async (req,res)=>{
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
           let user = await db.collection("StudentCredentials").findOne({email:req.body.email})
            if(user){
                res.json({message:"user already present"})
                console.log(uniqueString(req.body.email))
            }
            else{     // generate salt
                let salt=await bcrypt.genSalt(10)



                //hash the password
                let hash = await bcrypt.hash(req.body.password,salt)
                
                req.body.password=hash
        
        
               
      
               
                //storeindb
                 await db.collection("StudentCredentials").insertOne({...req.body,"unistring":uniqueString(req.body.email)})
                 
                 let reguser = await db.collection("StudentCredentials").findOne({email:req.body.email})
                console.log(reguser.unistring)
sendMail(req.body.email,reguser.unistring,"student")
                await connection.close()
                res.json({message:"user registered"})
        
            }

   
        
    }
    catch(error){
        console.log(error)
        res.send("NOT REG")
        
    }

})
app.post("/login/student", async (req,res)=>{
   try {
    let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
    let db=connection.db(DB)
     
    let user = await db.collection("StudentCredentials").findOne({email:req.body.email})
    

    if(user){
        const { password,verified,Adminverified, ...userWithoutPassword } = user;
        let isPassword = await bcrypt.compare(req.body.password,user.password)
        if(isPassword && verified &&Adminverified){
            let token =jwt.sign({_id:user._id},"divya")

            res.json({
                message:"allow",...userWithoutPassword,token
            })

        }
        else{
            res.status(404).json({
                message:"email or password is incorrect"
            })
        }
    }else{
        res.json({
            message:"user not found"
        })
        await connection.close()
    }
   }catch(error){
       console.log(error)
       res.json({message:"error"})
   }



})


app.post("/login/admin", async (req,res)=>{
    try {
     let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
     let db=connection.db(DB)
      
     let user = await db.collection("Admin").findOne({email:req.body.email})
     
 
     if(user){
         const { password, ...userWithoutPassword } = user;
         let isPassword =req.body.password==user.password
         if(isPassword ){
             let token =jwt.sign({_id:user._id},"divya")
 
             res.json({
                 message:"allow",...userWithoutPassword,token
             })
 
         }
         else{
             res.status(404).json({
                 message:"email or password is incorrect"
             })
         }
     }else{
         res.json({
             message:"user not found"
         })
         await connection.close()
     }
    }catch(error){
        console.log(error)
        res.json({message:"error"})
    }
 
 
 
 })


app.post("/register/faculty", async (req,res)=>{
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
           let user = await db.collection("FacultyCredentials").findOne({email:req.body.email})
            if(user){
                res.json({message:"user already present"})
            }
            else{     // generate salt
                let salt=await bcrypt.genSalt(10)



                //hash the password
                let hash = await bcrypt.hash(req.body.password,salt)
                
                req.body.password=hash
        
        
        
        
                //storeindb
                let users = await db.collection("FacultyCredentials").insertOne({...req.body,"unistring":uniqueString(req.body.email)})
           
                res.json({message:"user registered"})
                             
          
                 
                 let reguser = await db.collection("FacultyCredentials").findOne({email:req.body.email})
                
sendMail(req.body.email,reguser.unistring,"faculty")     
await connection.close()
        
            }

   
        
    }
    catch(error){
        console.log(error)
        res.send(error)
    }

})
app.post("/login/faculty", async (req,res)=>{
   try {
    let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
    let db=connection.db(DB)
     
    let user = await db.collection("FacultyCredentials").findOne({email:req.body.email})
    

    if(user){
        const { password,verified, ...userWithoutPassword } = user;
        let isPassword = await bcrypt.compare(req.body.password,user.password)
        if(isPassword && verified){
            let token =jwt.sign({_id:user._id},"divya")

            res.json({
                message:"allow",...userWithoutPassword,token
            })

        }
        else{
            res.status(404).json({
                message:"email or password is incorrect"
            })
        }
    }else{
        res.json({
            message:"user not found"
        })
        await connection.close()
    }
   }catch(error){
       console.log(error)
       res.json({message:"error"})
   }



})



function authenticate(req,res,next){
    //check if token is there
    console.log(req.headers)
    if(req.headers.authorization){
        //validating jwt token
       try{ 
        let jwtValid=jwt.verify(req.headers.authorization,"divya")
      if(jwtValid){
          next()
      }
       }
       catch(error){
       res.status(401).json({
           message:"invalid tokeN"
       })
       }
    }
    else{
        res.status(401).json({
            message:"no token present"
        })
    }
    //
   
}


app.get("/common",[authenticate, ],(req,res)=>{
    res.json({
        message:"common place"
    })
})

app.get("/dashboard",authenticate,function(req,res){
    res.json({
        message:"secure data"
    })
})


app.post("/createticket",  async (req, res) => {
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        let user = await db.collection("StudentCredentials").updateOne({email:req.body.email},{ $inc: { count: +1} })
        let query = await db.collection("Token").insertOne(req.body)
        res.json({message:"token Generated succesfully"})
      connection.close()
    }

    catch(error){
        console.log(error)
    }

});
app.post("/gettickets",  async (req, res) => {
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)

       const out= await db.collection("Token").find({"subject": req.body.subject[0]})
      if(out){
        out.toArray(function(error, documents) {
            if (error) throw error;
        if(documents.length>0){
            res.send(documents);}
            else{
                res.send([{message:'no data'}])
            }
        });
      }
  
    }
    catch(error){
        console.log(error)
    }

});
app.post("/mytickets", cors(), async (req, res) => {    
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
      const out=  await db.collection("Token").find({"email": req.body.email}).toArray(function(error, documents) {
            if (error) throw error; 
        
            res.send(documents);
        });
       
    }
    catch(error){
        console.log(error)
    }

});

app.post("/deletequery", async (req, res) => {
    try {
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
       
        await db.collection("Token").deleteOne({"_id": ObjectId(req.body.id)}).then(
        
            res.send("deleted")
        )
        
        await connection.close()
    }
    catch(error){
        console.log(error)
    }

});
app.post("/answertoken", cors(), async (req, res) => {    
    try {
        let facultyMail=req.body.email
        let facultyanswer=req.body.answer
        let facultyname=req.body.facultyname
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        let user = await db.collection("FacultyCredentials").updateOne({email:req.body.email},{ $inc: { count: +1} })
       
        await db.collection("Token").updateOne({"_id": ObjectId(req.body.id)}, {$push: {"answer": facultyname+ " : "+facultyanswer}}).then(res.send(req.body.answer))
       let {subject,query,collegeId}= await  db.collection("Token").findOne({"_id": ObjectId(req.body.id)})
        await db.collection("AnsweredQuestions").insertOne({facultyMail,facultyanswer,subject,query,collegeId})
        res.send("Answered")
      
    }
    catch(error){
        console.log(error)
    }

});

app.get("/verify/student/:uid",async (req, res) => {
   
    const { uid }=req.params
console.log(uid)
  try{
    let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
    let db=connection.db(DB)
    let user= await db.collection("StudentCredentials").find({"unistring":uid})
    console.log("user: " ,user)
    await db.collection("StudentCredentials").findOneAndUpdate({"unistring":uid}, { $set: { verified: true } })

    if(user){
       
     
        res.redirect('http://localhost:3000/')
    }
    
}
  catch(error){
    console.log(error)
  }
});
app.get("/verify/faculty/:uid",async (req, res) => {
   
    const { uid }=req.params
console.log(uid)
try{
    let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
    let db=connection.db(DB)
    let user= await db.collection("FacultyCredentials").findOne({"unistring":uid})
    console.log("user: " ,user)
    await db.collection("FacultyCredentials").findOneAndUpdate({"unistring":uid}, { $set: { verified: true } })

    if(user){
       
     
        res.redirect('http://localhost:3000/')
    }
    
}
  catch(error){
    console.log(error)
  }
});

const sendMail =(email,uniqueid,name)=>{
    var Transport =nodemailer.createTransport({
        service:'Gmail',
        auth:{
            user:process.env.mail,
            pass:process.env.pwd
        }
    })

    var sender='Support Hub'
    var mailOptions={
        from:sender,
        to:email,
        subject:'Email Confirmation',
        html:`Press <a href=http://localhost:8000/verify/${name}/${uniqueid}> here </a> to verify your Email. Thanks`
    }

Transport.sendMail(mailOptions,function(error,response){
    if(error){
        console.log(error)
    }
    else{
        console.log('message sent')
    }
})

}

//admin


app.post("/admin/unauthorizedusers", async(req, res) => {
    try {
        let designation=req.body.designation.charAt(0).toUpperCase() + req.body.designation.slice(1)
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        outdata=[]
      const out=  await db.collection(designation+"Credentials").find({"Adminverified": false}).toArray(function(error, documents) {
            if (error) throw error; 
        
            let result  = documents.map(el => {
                let obj = {};
                Object.entries(el).forEach(([key, val]) => {
                    if (key!=='password'&&key!='Adminverified'&&key!='verified')
                        obj[key] = val;
                })
                return obj;
            });


            res.send(result);
        });
       
    }
    catch(error){
        console.log(error)
    }
});
app.post("/admin/unauthorizedusers/delete", async(req, res) => {
    try {
        let designation=req.body.designation
        let id=req.body.id
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        outdata=[]
      const out=  await db.collection(designation+"Credentials").deleteOne({"_id": ObjectId(req.body.id)}).then(
        
        res.send("deleted")
    )
       
    }
    catch(error){
        console.log(error)
    }
});


app.post("/admin/unauthorizedusers/verify", async(req, res) => {
    try {
        let designation=req.body.designation
       
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        outdata=[]
      const out=  await db.collection(designation+"Credentials").findOneAndUpdate({"_id": ObjectId(req.body.id)}, { $set: { Adminverified: true } })
       res.send("verified")
    }
    catch(error){
        console.log(error)
    }
});

app.get("/admin/studentquestions", async(req, res) => {
    try {
   
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        outdata=[]
      const out=  await db.collection("StudentCredentials").find().toArray(function(error, documents) {
            if (error) throw error; 
        
            let result  = documents.map(el => {
                let obj = {};
                Object.entries(el).forEach(([key, val]) => {
                    if (key=='email'||key=='collegeid'||key=='name'||key=='count')
                        obj[key] = val;
                })
                return obj;
            });


            res.send(result);
        });
       
    }
    catch(error){
        console.log(error)
    }
});
app.get("/admin/facultyanswers", async(req, res) => {
    try {
   
        let connection = await mongodb.connect(URL,{ useUnifiedTopology: true } )
        let db=connection.db(DB)
        outdata=[]
      const out=  await db.collection("FacultyCredentials").find().toArray(function(error, documents) {
            if (error) throw error; 
        
            let result  = documents.map(el => {
                let obj = {};
                Object.entries(el).forEach(([key, val]) => {
                    if (key=='email'||key=='collegeid'||key=='name'||key=='count')
                        obj[key] = val;
                })
                return obj;
            });


            res.send(result);
        });
       
    }
    catch(error){
        console.log(error)
    }
});
app.get("/", (req, res) => {
  res.send("support-hub")
});
const port =process.env.PORT||8000;
app.listen(port,()=>{console.log(`listening ${port}`)})