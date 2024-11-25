const bcrypt = require('bcryptjs');
const User = require('../models/user');

exports.getLogin = (req, res) => {
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false,
    });
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: false,
    });
};

exports.postLogin = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    User.findOne('673f507700267e7e9c15daa7')
        .then((user) => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
                console.log(err);
                res.redirect('/');
            });
        })
        .catch((err) => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    User.findOne({ email })
        .then((userDoc) => {
            if (userDoc) {
                return res.redirect('/signup');
            }
            return bcrypt
                .hash(password, 12)
                .then((hashedPassword) => {
                    const user = new User({
                        email,
                        password: hashedPassword,
                        car: { items: [] },
                    });

                    return user.save();
                })
                .then(() => {
                    res.redirect('/login');
                });
        })

        .catch((err) => console.log(err));
};

exports.postLogout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};
