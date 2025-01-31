const Product = require('../models/product');

exports.getAddProduct = (req, res) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
    });
};

exports.postAddProduct = (req, res) => {
    const { title, imageUrl, price, description } = req.body;
    req.user
        .createProduct({
            title,
            price,
            imageUrl,
            description,
        })
        .then(() => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch((err) => console.log(err));
};

exports.getEditProduct = (req, res) => {
    const editMode = req.query.edit;
    const prodId = req.params.productId;

    if (!editMode) {
        return res.redirect('/');
    }

    req.user
        .getProducts({ where: { id: prodId } })
        .then((products) => {
            const product = products[0];

            if (!product) {
                return res.redirect('/');
            }

            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
            });
        })
        .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;

    Product.findByPk(prodId)
        .then((product) => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDesc;
            product.imageUrl = updatedImageUrl;
            return product.save();
        })
        .then(() => {
            console.log('Updated Product');
            res.redirect('/admin/products');
        })
        .catch((err) => console.log(err));
};

exports.getProducts = (req, res) => {
    req.user
        .getProducts()
        .then((products) => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            });
        })
        .catch((err) => console.log(err));
};

exports.postDeleteProduct = (req, res) => {
    const prodId = req.body.productId;

    Product.findByPk(prodId)
        .then((product) => {
            return product.destroy();
        })
        .then(() => {
            console.log('Destroyed Product');
            res.redirect('/admin/products');
        })
        .catch((err) => console.log(err));

    res.redirect('/admin/products');
};
