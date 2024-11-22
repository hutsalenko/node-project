const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, _, next) => {
    User.findById('673f507700267e7e9c15daa7')
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        'mongodb+srv://ivangutsalenko92:70biPAYmrs24HVGz@cluster0.bsq4a.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0'
    )
    .then(() => {
        User.findOne().then((user) => {
            if (!user) {
                const user = new User({
                    name: 'Ivan',
                    email: 'ivan@gmail.com',
                    cart: {
                        items: [],
                    },
                });
                user.save();
            }
        });
        app.listen(3000);
    })
    .catch((err) => console.log(err));
