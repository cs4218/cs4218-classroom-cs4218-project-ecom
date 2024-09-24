import braintree, { BraintreeGateway } from "braintree";
import orderModel from "../models/orderModel.js";
import {
    braintreeTokenController,
    brainTreePaymentController,
    createProductController,
    deleteProductController,
    updateProductController
} from "./productController";
import fs from 'fs';
import slugify from "slugify";
import productModel from "../models/productModel";

// Mock the Braintree gateway
jest.mock('braintree', () => {
    const generate = jest.fn();
    const sale = jest.fn();
    return {
        BraintreeGateway: jest.fn().mockImplementation(() => {
            return {
                clientToken: {
                    generate: generate
                },
                transaction: {
                    sale: sale
                },
            };
        }),
        Environment: {
            Sandbox: 'sandbox'
        },
    };
});

jest.mock('../models/orderModel.js');
jest.mock("../models/productModel");
jest.mock("slugify");
jest.mock('fs');

describe('productController', () => {
    let req, res;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };
        jest.clearAllMocks();

        process.env.BRAINTREE_MERCHANT_ID = 'test_merchant_id';
        process.env.BRAINTREE_PUBLIC_KEY = 'test_public_key';
        process.env.BRAINTREE_PRIVATE_KEY = 'test_private_key';
    });

    describe('braintreeTokenController', () => {
        // NEVER PASS
        test('should generate client token and send in response', async () => {
            const gateway = new braintree.BraintreeGateway();
            gateway.clientToken.generate.mockImplementation((_, callback) => {
                callback(null, { clientToken: 'fake-client-token' });
            });

            await braintreeTokenController(req, res);

            expect(res.send).toHaveBeenCalledWith({ clientToken: 'fake-client-token' });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should handle error when generating client token', async () => {
            const error = new Error('Error generating token');
            const gateway = new braintree.BraintreeGateway();
            gateway.clientToken.generate.mockImplementation((_, callback) => {
                callback(error);
            });

            await braintreeTokenController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(error);
        });

        // NEVER PASS
        test('should handle error thrown in try block', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const error = new Error('Test error');
            const gateway = new braintree.BraintreeGateway();
            gateway.clientToken.generate.mockImplementation(() => {
                throw error;
            });

            await braintreeTokenController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(consoleLogSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('brainTreePaymentController', () => {
        beforeEach(() => {
            req = {
                body: {
                    nonce: 'nonce',
                    cart: [{ price: 10 }, { price: 20 }],
                },
                user: { _id: 1 }
            }
            jest.clearAllMocks();
        });

        // NEVER PASS
        test('should successfully order ', async () => {
            const gateway = new braintree.BraintreeGateway();
            gateway.transaction.sale.mockImplementation((_, callback) => {
                callback(null, {})
            });

            // Mock orderModel
            orderModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({}),
            }));

            await brainTreePaymentController(req, res);

            // check that transaction sale was called with correct amount and paymentMethodNonce
            expect(gateway.transaction.sale).toHaveBeenCalledWith({
                amount: 30,
                paymentMethodNonce: 'nonce',
                options: {
                    submitForSettlement: true,
                }
            }, expect.any(Function));

            // check that orderModel was called with correct parameters
            expect(orderModel).toHaveBeenCalledWith({
                products: req.body.cart,
                payment: expect.any(Object),
                buyer: req.user._id
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ ok: true });
        });

        test('should handle error when perfoming transaction sale', async () => {
            const error = new Error('Transaction sale error');
            const gateway = new braintree.BraintreeGateway();
            gateway.transaction.sale.mockImplementation((_, callback) => {
                callback(error);
            });

            await brainTreePaymentController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(error);
        });

        // NEVER PASS
        test('should handle error when thrown in try block', async () => {
            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            const error = new Error('Test error');
            const gateway = new braintree.BraintreeGateway();
            gateway.transaction.sale.mockImplementation(() => {
                throw error;
            });

            await braintreeTokenController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(consoleLogSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('createProductController', () => {
        let req, res, consoleLogSpy;
        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
                json: jest.fn()
            };
            jest.clearAllMocks();
        });
        test('should return 500 with correct error message if no req body', async () => {
            req.body = {};

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error in crearing product'
            });
        });

        test('should return 500 with correct error message if no name in req body', async () => {
            req.fields = {
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Name is Required'
            });
        })

        test('should return 500 with correct error message if no description in req body', async () => {
            req.fields = {
                name: 'Test Name',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Description is Required'
            });
        });

        test('should return 500 with correct error message if no price in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Price is Required'
            });
        });

        test('should return 500 with correct error message if no quantity in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Quantity is Required'
            });
        });

        test('should return 500 with correct error message if no category in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                quantity: 10,
                price: 100,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Category is Required'
            });
        });

        test('should return 500 with correct error message if no photo in req files', async () => {
            // supposed to fail due to error in original implementation
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                quantity: 10,
                shipping: true
            };
            req.files = {};

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb'
            });
        });

        test('should return 500 with correct error message if photo there but too large', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1000002
                }
            };

            await createProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb'
            });
        });

        test('should return 201 and create new product with valid data', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };

            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024,
                    type: 'image/jpeg'
                }
            };

            productModel.findOne.mockResolvedValue(null);
            slugify.mockReturnValue('test-slug');

            const mockPhotoBuffer = Buffer.from('mock-photo-data');
            fs.readFileSync = jest.fn().mockReturnValue(mockPhotoBuffer);

            let createdProduct = null;
            productModel.mockImplementation((data) => {
                createdProduct = {
                    ...data,
                    photo: {
                        data: mockPhotoBuffer,
                        contentType: req.files.photo.type
                    }
                };

                return {
                    ...createdProduct,
                    save: jest.fn().mockResolvedValue(createdProduct)
                };
            });

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Product Created Successfully",
                products: expect.objectContaining({
                    name: 'Test Name',
                    slug: 'test-slug',
                    description: 'Test Description',
                    price: 100,
                    category: 'Test Category',
                    quantity: 10,
                    shipping: true,
                    photo: expect.objectContaining({
                        data: mockPhotoBuffer,
                        contentType: 'image/jpeg'
                    })
                })
            });
        });
    });

    describe('deleteProductController', () => {
        let req, res, consoleLogSpy;

        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
        });


        test('should return 500 with invalid id', async () => {
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            req.params = { pid: "ABCD" };
            productModel.findByIdAndDelete = jest.fn().mockReturnValue(null);

            await deleteProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error while deleting product'
            });
        });

        test('should return 500 with empty id', async () => {
            consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            req.params = { pid: '' };
            productModel.findByIdAndDelete = jest.fn().mockReturnValue(null);

            await deleteProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error while deleting product'
            });
        });
    })

    describe('updateProductController', () => {
        let req, res, consoleLogSpy;
        beforeEach(() => {
            req = {};
            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
        });

        test('should return 500 with correct error message if no req content', async () => {
            req.body = {};

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: expect.any(Error),
                message: 'Error in Updte product'
            });
        });

        test('should return 500 with correct error message if no pid in req paramas', async () => {
            req.fields = {
                name: "Test Name",
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };
            req.params = {}

            productModel.findByIdAndUpdate = jest.fn().mockReturnValue(null);

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error in Updte product',
                error: expect.any(Error),
            });
        })

        test('should return 500 with correct error message if invalid pid in req paramas', async () => {
            req.fields = {
                name: "Test Name",
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };
            req.params = { pid: "XXX" }

            productModel.findByIdAndUpdate = jest.fn().mockReturnValue(null);

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Error in Updte product',
                error: expect.any(Error),
            });
        })

        test('should return 500 with correct error message if no name in req fieldss', async () => {
            req.fields = {
                description: 'Test Description',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };
            req.params = { pid: 1 }

            productModel.findByIdAndUpdate = jest.fn().mockReturnValue(null);

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Name is Required'
            });
        });

        test('should return 500 with correct error message if no description in req fieldss', async () => {
            req.fields = {
                name: 'Test Name',
                price: 100,
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };
            req.params = { pid: 1 }

            productModel.findByIdAndUpdate = jest.fn().mockReturnValue(null);

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Description is Required'
            });
        });

        test('should return 500 with correct error message if no price in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            req.params = { pid: 1 }

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Price is Required'
            });
        });

        test('should return 500 with correct error message if no quantity in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            req.params = { pid: 1 }

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Quantity is Required'
            });
        });

        test('should return 500 with correct error message if no category in req body', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                quantity: 10,
                price: 100,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 1024
                }
            };

            req.params = { pid: 1 }

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'Category is Required'
            });
        });

        test('should return 500 with correct error message if no photo in req files', async () => {
            // supposed to fail due to error in original implementation
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                quantity: 10,
                shipping: true
            };
            req.files = {};

            req.params = { pid: 1 }

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb'
            });
        });

        test('should return 500 with correct error message if photo there but too large', async () => {
            req.fields = {
                name: 'Test Name',
                description: 'Test Description',
                category: 'Test Category',
                price: 100,
                quantity: 10,
                shipping: true
            };
            req.files = {
                photo: {
                    path: 'client/public/images/test-pdt-img-1.jpg',
                    size: 10000003
                }
            };

            req.params = { pid: 1 }

            await updateProductController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                error: 'photo is Required and should be less then 1mb'
            });
        });

    });
});


