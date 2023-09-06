const express = require("express");
const mysql = require("mysql");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const app = express();
const port = 3000;
const connection = mysql.createConnection( {
	host: "localhost",
	user: "root",
	password: "root",
	port: 3306,
	database: "comp484"
} );

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: "secretboo",
    saveUninitialized: true,
    resave: true
}));

connection.connect( (err) => {
	if (err) throw err;
	console.log("MySQL connection successful");
} );

app.get("/", (req, res) => {
	if (req.session.loggedIn) {
		let retstr = "";
		let statement = "SELECT count FROM user WHERE userid=" + req.session.userID + ";";

		connection.query(statement, (err, rows) => {
			if (err) throw err;

			retstr += "<h1>HOME</h1><br>";
			retstr += "You're logged in!<br>";
			retstr += ("Count: " + rows[0].count);
			retstr += "<form method=\"post\" action=\"/\">";
  			retstr += "<input type=\"submit\" value=\"Increment\">";
			retstr += "</form>";
			retstr += "<form method=\"post\" action=\"/logout\">";
  			retstr += "<input type=\"submit\" value=\"Logout\">";
			retstr += "</form>";
	        res.send(retstr);
	    });
	}
    else {
        res.sendFile("welcome.html", {root: __dirname} );
    }
});

app.get("/register", (req, res) => {
	res.sendFile("register.html", {root: __dirname} );
});

app.get("/login", (req, res) => {
	res.sendFile("login.html", {root: __dirname} );
});

app.post('/', (req, res) => {
	let statement = "UPDATE user SET count=count+1 WHERE userid=" + req.session.userID;

	connection.query(statement, (err) => {
		if (err) throw err;
		res.redirect("/");
	});
});

app.post('/logout', (req, res) => {
	let retstr = "";
	req.session.destroy();
	retstr += "You logged out.<br>Click <a href=\"/\">HERE</a> to return.";
	res.send(retstr);
});

app.post('/register', (req, res) => {
	let retstr = "";
	let usernameTaken = false;
	let firstStatement = "SELECT username FROM user;";
	let secondStatement = "INSERT INTO user (username,password) VALUES ('" + req.body.username + "','" + req.body.password + "');";

	connection.query(firstStatement, (err, rows) => {
		if (err) throw err;

		for(let i = 0; i < rows.length; i++) {
    		let user = rows[i];

			if(user.username === req.body.username) {
				usernameTaken = true;
			}
		}
	});

	if(!usernameTaken) {
		connection.query(secondStatement, (err) => {
			if (err) throw err;

			retstr += "Account created!<br>Click <a href=\"/login\">HERE</a> to go to login page.";
			res.send(retstr);
		});
	}
	else {
		retstr += "That username is taken.<br>Click <a href=\"/\">HERE</a> to try again.";
		res.send(retstr);
	}
});

app.post('/login', (req, res) => {
	let retstr = "";
	let statement = "SELECT * FROM user;";
	let valid = false;
	let userID = -1;

	connection.query(statement, (err, rows) => {
		if (err) throw err;

		for(let i = 0; i < rows.length; i++) {
    		let user = rows[i];
			if((user.username === req.body.username) && (user.password === req.body.password)) {
				valid = true;
				userID = user.userid;
				break;
			}
		}

		if(valid) {
			req.session.loggedIn = true;
			req.session.userID = userID;
			res.redirect("/");
		}
		else {
			retstr = "Login info incorrect.<br>Click <a href=\"/login\">HERE</a> to try again.";
			res.send(retstr);
		}
	});
});

app.listen(port, () => {
	console.log("Server port: " + port);
});