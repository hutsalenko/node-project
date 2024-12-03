const Product = require('../models/product');
const Order = require('../models/order');

const PDFDocument = require('pdfkit');

const ITEMS_PER_PAGE = 2;

exports.getProducts = async (req, res, next) => {
    const page = +req.query.page || 1;

    try {
        const totalItems = await Product.find().countDocuments();
        const products = await Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'Products',
            path: '/products',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getProduct = async (req, res) => {
    const prodId = req.params.productId;

    try {
        const product = await Product.findById(prodId);
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getIndex = async (req, res, next) => {
    const page = +req.query.page || 1;

    try {
        const totalItems = await Product.find().countDocuments();
        const products = await Product.find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);

        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getCart = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = async (req, res) => {
    const prodId = req.body.productId;

    try {
        const product = await Product.findById(prodId);
        await req.user.addToCart(product);
        res.redirect('/cart');
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.postCartDeleteProduct = (req, res) => {
    const prodId = req.body.productId;

    req.user
        .removeFromCart(prodId)
        .then(() => {
            res.redirect('/cart');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postOrder = (req, res) => {
    req.user
        .populate('cart.items.productId')
        .then((user) => {
            const products = user.cart.items.map((i) => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
                products: products,
            });
            order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 'user.userId': req.user._id });
        res.render('shop/orders', {
            path: '/orders',
            pageTitle: 'Your Orders',
            orders: orders,
        });
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    }
};

exports.getInvoice = async (req, res, next) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return next(new Error('No order found.'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {
            underline: true,
        });
        pdfDoc.text('-----------------------');
        let totalPrice = 0;
        order.products.forEach((prod) => {
            totalPrice += prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        });
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

        pdfDoc.end();
    } catch (err) {
        next(err);
    }
};
