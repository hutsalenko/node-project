const Product = require('../models/product');

exports.getProducts = (req, res) => {
    Product.findAll()
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
            });
        })
        .catch((err) => console.log(err));
};

exports.getProduct = (req, res) => {
    const prodId = req.params.productId;
    // Product.findAll({ where: { id: prodId } })
    //     .then(([product]) => {
    //         res.render('shop/product-detail', {
    //             product: product[0],
    //             pageTitle: product[0].title,
    //             path: '/products',
    //         });
    //     })
    //     .catch((err) => console.log(err));
    Product.findByPk(prodId)
        .then(([product]) => {
            res.render('shop/product-detail', {
                product: product[0],
                pageTitle: product[0].title,
                path: '/products',
            });
        })
        .catch((err) => console.log(err));
};

exports.getIndex = (req, res) => {
    Product.findAll()
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
            });
        })
        .catch((err) => console.log(err));
};

exports.getCart = (req, res) => {
    req.user
        .getCart()
        .then((cart) => {
            return cart
                .getProducts()
                .then((products) => {
                    res.render('shop/cart', {
                        path: '/cart',
                        pageTitle: 'Your Cart',
                        products: products,
                    });
                })
                .catch((err) => console.log(err));
        })
        .catch((err) => console.log(err));
};

exports.postCart = (req, res) => {
    const prodId = req.body.productId;
    let fetchedCart;
    let newQuantity = 1;

    req.user
        .getCart()
        .then((cart) => {
            fetchedCart = cart;
            return cart.getProducts({ where: { id: prodId } });
        })
        .then((products) => {
            let product;
            if (products.length > 0) {
                product = products[0];
            }

            if (product) {
                const oldQuantity = product.cartItem.quantity;
                newQuantity = oldQuantity + 1;
                return product;
            }
            return Product.findByPk(prodId);
        })
        .then((product) => {
            return fetchedCart.addProduct(product, {
                through: { quantity: newQuantity },
            });
        })
        .then(() => res.redirect('/cart'))
        .catch((err) => console.log(err));
};

exports.postCartDeleteProduct = (req, res) => {
    const prodId = req.body.productId;

    req.user
        .getCart()
        .then((cart) => {
            return cart.getProducts({ where: { id: prodId } });
        })
        .then((products) => {
            const product = products[0];
            return product.cartItem.destroy();
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch((err) => console.log(err));
};

exports.postOrder = (req, res) => {
    let fetchedCart;

    req.user
        .getCart()
        .then((cart) => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then((products) => {
            return req.user
                .createOrder()
                .then((order) => {
                    order.addProducts(
                        products.map((product) => {
                            product.orderItem = { quantity: product.cartItem.quantity };
                            return product;
                        })
                    );
                })
                .catch((err) => console.log(err));
        })
        .then(() => {
            return fetchedCart.setProducts(null);
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch((err) => console.log(err));
};

exports.getOrders = (req, res) => {
    req.user
        .getOrders({ include: ['products'] })
        .then((orders) => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
            });
        })
        .catch((err) => console.log(err));
};
