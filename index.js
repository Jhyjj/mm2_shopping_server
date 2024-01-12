const express = require ("express")
const cors = require("cors")
const app = express();
const port = process.env.PORT || 8080;
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



//이미지 업로드
app.use("/upload", express.static("upload"));

const storage = multer.diskStorage({
    destination: "./upload/",
    filename: function(req, file, cb) {
        cb(null, file.originalname);  
    }
  });

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }
});

//대표이미지 등록
app.post("/upload", upload.array('imgs'), function(req, res, next) {
    const imgfile = [];
    req.files.map((img)=> imgfile.push(img.filename))
    res.send({
    imgs : imgfile
    });
});



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

//상품리스트 출력(검색 또는 카테고리로 이동시)
app.get("/products/:keyword", async (req,res)=>{
    console.log(req.params)
    const params = req.params
    const {keyword} = params
    console.log(keyword)
    connection.query(
        //SELECT * FROM products where p_part1 like '%치석%' or p_part2 like '%치석%' or p_keyword like '%치석%';
        `select * from products where p_part1 like '%${keyword}%' or p_part2 like '%${keyword}%' or p_keyword like '%${keyword}%'`,
        (err,rows,fields)=>{
            console.log(rows);
            res.send(rows);
        }
    )
})

//상품 상세페이지로 이동
app.get("/detail/:no", async (req,res)=>{
    console.log(req.params)
    const params = req.params
    const {no} = params
    console.log(no)
    connection.query(`select * from products where no = '${no}'`,
    (err,rows,fields)=>{
        console.log(rows);
        res.send(rows[0])
    })
})

//장바구니 담기
app.post("/cart/:id", async (req,res)=>{
    console.log(req.params)
    const params = req.params
    // console.log(req.body)
    const {id} = params
    if(req.body.length>1){
        req.body.map(cart=>(
            connection.query("insert into cart (`userId`,`p_name`,`p_opt`,`p_qty`,`p_price`,`t_price`,`p_img`) values(?,?,?,?,?,?,?)",
            [id, cart.p_name, cart.optname, cart.qty, cart.price, cart.price2, cart.img],
            (err,rows,fields)=>{
            })
        ))
    }
else{
        const [{p_name, optname, qty, price, price2, img}] = req.body
        console.log(optname)
        connection.query("insert into cart (`userId`,`p_name`,`p_opt`,`p_qty`,`p_price`,`t_price`,`p_img`) values(?,?,?,?,?,?,?)",
        [id,p_name,optname,qty,price,price2,img],
        (err,rows,fields)=>{
        })
    }
 })

//장바구니 조회
app.post("/mycart/:id", async (req,res)=>{
    const params = req.params
    const {id} = params
    connection.query(`select * from cart where userId = '${id}'`,
    (err,rows,fields)=>{
        res.send(rows)
    })
})

//장바구니 삭제
app.post("/mycartdelete/:id", async (req,res)=>{
    const params = req.params
    const {id} = params
    console.log(req.body)
    if(req.body.length>=1){
        req.body.map(cart=>(
            connection.query(`delete from cart where no ='${cart.no}'`,
            (err,rows,fields)=>{
            })
        ))
    }
})

//주문 테이블로 넘기고, 주문한 제품은 장바구니에서 삭제하기
app.post("/myorder/:id", async (req,res)=>{
    const params = req.params
    const {id} = params
    if(req.body.length>=1){
        const p_names = (req.body.map(data=>(data.p_name))).join(',');
        const prices = req.body.reduce(function(init,opt){
        return init+Number(opt.t_price)
        },0);
        console.log(p_names,prices)
        console.log(req.body)
        connection.query("insert into orders (`userId`,`p_name`,`order_price`) values(?,?,?);",
        [id, p_names, String(prices)],
        (err,rows,fields)=>{
            res.send(rows[0])
        })
        req.body.map(cart=>(
            connection.query(`delete from cart where no ='${cart.no}';`,
            (err,rows,fields)=>{
            })
        ))
    }
    
})

//마이페이지에 주문내역 출력하기
app.get("/myorders/:id", async (req,res)=>{
    const {id} = req.params;
    console.log(id)
    connection.query(`select * from orders where userId = '${id}'`,
    (err,rows,fields)=>{
        console.log(rows)
        res.send(rows)
    })
})


//마이페이지 작성리뷰 출력하기
app.get("/myreview/:id", async (req,res)=>{
    const {id} = req.params;
    connection.query(`select * from reviews where userId = '${id}'`,
    (err,rows,fields)=>{
        console.log(rows)
        res.send(rows)
    })
})


//리뷰 작성
app.post("/review", async (req,res)=>{
    console.log(req.body);
    const {p_name, title, desc, img, userId, date} = req.body;
    connection.query("insert into reviews (`p_name`,`title`,`desc`,`img`,`userId`,`date`) values(?,?,?,?,?,?)",
    [p_name,title,desc,img,userId,date],
    (err,rows,fields)=>{
        res.send(rows)
    })
})


//제품 상세페이지에서 해당 제품의 리뷰들을 출력하기
app.get("/review/:product", async (req,res)=>{
    const {product} = req.params;
    connection.query(`select * from reviews where p_name = '${product}'`,
    (err,rows,fields)=>{
        res.send(rows)
    })
})

//메인화면에서 포토리뷰만 출력하기
app.post("/photoreview", async (req,res)=>{
    connection.query(`select * from reviews where not img = ''`,
    (err,rows,fields)=>{
        res.send(rows)
        console.log(rows)
    })
})