const express = require ("express")
const cors = require("cors")
const app = express();
const port = 3001;
const mysql = require("mysql");
const fs = require("fs");
const multer = require("multer");

const dbinfo = fs.readFileSync('./database.json');
//받아온 JSON데이터를 객체형태로 변경 JSON.parse
const conf = JSON.parse(dbinfo)

const connection = mysql.createConnection({
    host: conf.host,
    user: conf.user,
    password: conf.password,
    port: conf.port,
    database: conf.database
})

app.use(express.json());
app.use(cors());

//서버실행
app.listen(port, ()=>{
    console.log('서버가 돌아가고 있습니다.')
})

//상품등록하기
app.post("/addProduct", async (req,res)=>{
    const {p_name, p_intro, p_price, p_part1, p_part2, p_option, p_img, p_detail, p_keyword } = req.body;
    connection.query(
        "insert into products(`p_name`,`p_intro`,p_price,`p_part1`,`p_part2`,`p_option`,`p_img`,`p_detail`,`p_keyword`) values(?,?,?,?,?,?,?,?,?)",
        [p_name,p_intro,p_price,p_part1,p_part2,p_option,p_img,p_detail,p_keyword],
        (err,rows,fields)=>{
            console.log(rows);
        })
        res.send("등록되었습니다.")
})

//이미지 저장
const storage = multer.diskStorage({
    destination:function(req,res,cb){
        cb(null, 'public/img/')
    },
    filename:function(req,file,cb){
        cb(null, file.originalname);
    }
})

//파일사이즈 지정
const upload = multer({
    storage:storage,
    limits:{fileSize:30000000}
})

//사진 서버로 받기
app.post("/upload", async (req,res)=>{
    console.log(req.body)
})


//회원가입
app.post("/join", async (req,res)=>{
    const phone=`${req.body.p1}-${req.body.p2}-${req.body.p3}`
    const addr = `${req.body.add1} ${req.body.add2}`
    const {id, name, pw, isPet, petName} = req.body
    connection.query(
        "insert into members (`id`,`pw`,`name`,`phone`,`isPet`,`petname`,`add`) values(?,?,?,?,?,?,?)",
        [id,pw,name,phone,isPet,petName,addr],
        (err,rows,fields)=>{
            console.log(rows)
            res.send("등록되었습니다.")
        }
    )
})

//아이디 중복 체크
app.post("/idcheck", async (req,res)=>{
    const {id} = req.body
    connection.query(
        `select * from members where id = '${id}'`,
        (err,rows,fields)=>{
            console.log(rows)
            res.send(rows)
        }
    )
})

//로그인
app.post("/login", async (req,res)=>{
    const {userId, userPass} = req.body;
    connection.query(`select * from members where id = '${userId}'`,
    (err,rows,fields)=>{
        if(rows != undefined){
            if(rows[0] == undefined){
                res.send(null)
            }else{
                if(rows[0].pw===userPass){
                    res.send(rows[0])
                    console.log(rows[0])
                }else{
                    res.send('로그인 실패')
                }
            }
        }else{
            res.send(null)
        }
    })
})

//상품리스트 출력
app.get("/products/:part", async (req,res)=>{
    console.log(req.params)
    // connection.query(`select * from products where part1 = ``)
})