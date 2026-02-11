/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SupplierController } from './../controllers/supplierController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PurchaseOrderController } from './../controllers/poController';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './../controllers/healthController';
import { iocContainer } from './../ioc/ioc';
import type { IocContainer, IocContainerFactory } from '@tsoa/runtime';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "_36_Enums.SupplierStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ACTIVE"]},{"dataType":"enum","enums":["SUSPENDED"]},{"dataType":"enum","enums":["BLACKLISTED"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_SupplierPayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"status":{"ref":"_36_Enums.SupplierStatus","required":true},"address":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"phone":{"dataType":"string","required":true},"contactPerson":{"dataType":"string","required":true},"companyName":{"dataType":"string","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Supplier": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_SupplierPayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SupplierStatus": {
        "dataType": "refAlias",
        "type": {"ref":"_36_Enums.SupplierStatus","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SupplierCreationParams": {
        "dataType": "refObject",
        "properties": {
            "companyName": {"dataType":"string","required":true},
            "contactPerson": {"dataType":"string"},
            "email": {"dataType":"string"},
            "phone": {"dataType":"string"},
            "address": {"dataType":"string"},
            "taxId": {"dataType":"string"},
            "paymentTerms": {"dataType":"string"},
            "status": {"ref":"SupplierStatus"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_SupplierCreationParams_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"companyName":{"dataType":"string"},"contactPerson":{"dataType":"string"},"email":{"dataType":"string"},"phone":{"dataType":"string"},"address":{"dataType":"string"},"taxId":{"dataType":"string"},"paymentTerms":{"dataType":"string"},"status":{"ref":"_36_Enums.SupplierStatus"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "_36_Enums.POStatus": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["DRAFT"]},{"dataType":"enum","enums":["PENDING_APPROVAL"]},{"dataType":"enum","enums":["APPROVED"]},{"dataType":"enum","enums":["REJECTED"]},{"dataType":"enum","enums":["SENT_TO_SUPPLIER"]},{"dataType":"enum","enums":["IN_PRODUCTION"]},{"dataType":"enum","enums":["READY"]},{"dataType":"enum","enums":["SHIPPED"]},{"dataType":"enum","enums":["IN_TRANSIT"]},{"dataType":"enum","enums":["DELIVERED"]},{"dataType":"enum","enums":["CLOSED"]},{"dataType":"enum","enums":["CANCELLED"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DefaultSelection_Prisma._36_PurchaseOrderPayload_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"remarks":{"dataType":"string","required":true},"currency":{"dataType":"string","required":true},"expectedDeliveryDate":{"dataType":"datetime","required":true},"poDate":{"dataType":"datetime","required":true},"divisionId":{"dataType":"string","required":true},"supplierId":{"dataType":"string","required":true},"poNumber":{"dataType":"string","required":true},"paymentTerms":{"dataType":"string","required":true},"updatedAt":{"dataType":"datetime","required":true},"createdAt":{"dataType":"datetime","required":true},"status":{"ref":"_36_Enums.POStatus","required":true},"id":{"dataType":"string","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PurchaseOrder": {
        "dataType": "refAlias",
        "type": {"ref":"DefaultSelection_Prisma._36_PurchaseOrderPayload_","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreatePOParams": {
        "dataType": "refObject",
        "properties": {
            "supplierId": {"dataType":"string","required":true},
            "expectedDeliveryDate": {"dataType":"datetime"},
            "currency": {"dataType":"string"},
            "paymentTerms": {"dataType":"string"},
            "remarks": {"dataType":"string"},
            "items": {"dataType":"array","array":{"dataType":"nestedObjectLiteral","nestedProperties":{"remarks":{"dataType":"string"},"totalPrice":{"dataType":"double","required":true},"unitPrice":{"dataType":"double","required":true},"quantity":{"dataType":"double","required":true},"sku":{"dataType":"string"},"productName":{"dataType":"string","required":true}}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsSupplierController_getSupplier: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/suppliers/:id',
            ...(fetchMiddlewares<RequestHandler>(SupplierController)),
            ...(fetchMiddlewares<RequestHandler>(SupplierController.prototype.getSupplier)),

            async function SupplierController_getSupplier(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSupplierController_getSupplier, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SupplierController>(SupplierController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'getSupplier',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSupplierController_getAllSuppliers: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/suppliers',
            ...(fetchMiddlewares<RequestHandler>(SupplierController)),
            ...(fetchMiddlewares<RequestHandler>(SupplierController.prototype.getAllSuppliers)),

            async function SupplierController_getAllSuppliers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSupplierController_getAllSuppliers, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SupplierController>(SupplierController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'getAllSuppliers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSupplierController_createSupplier: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"SupplierCreationParams"},
        };
        app.post('/suppliers',
            ...(fetchMiddlewares<RequestHandler>(SupplierController)),
            ...(fetchMiddlewares<RequestHandler>(SupplierController.prototype.createSupplier)),

            async function SupplierController_createSupplier(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSupplierController_createSupplier, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SupplierController>(SupplierController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'createSupplier',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSupplierController_updateSupplier: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"Partial_SupplierCreationParams_"},
        };
        app.put('/suppliers/:id',
            ...(fetchMiddlewares<RequestHandler>(SupplierController)),
            ...(fetchMiddlewares<RequestHandler>(SupplierController.prototype.updateSupplier)),

            async function SupplierController_updateSupplier(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSupplierController_updateSupplier, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SupplierController>(SupplierController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'updateSupplier',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsSupplierController_deleteSupplier: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/suppliers/:id',
            ...(fetchMiddlewares<RequestHandler>(SupplierController)),
            ...(fetchMiddlewares<RequestHandler>(SupplierController.prototype.deleteSupplier)),

            async function SupplierController_deleteSupplier(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSupplierController_deleteSupplier, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<SupplierController>(SupplierController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'deleteSupplier',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 204,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseOrderController_getAllOrders: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/orders',
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController.prototype.getAllOrders)),

            async function PurchaseOrderController_getAllOrders(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseOrderController_getAllOrders, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<PurchaseOrderController>(PurchaseOrderController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'getAllOrders',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseOrderController_getOrder: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/orders/:id',
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController.prototype.getOrder)),

            async function PurchaseOrderController_getOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseOrderController_getOrder, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<PurchaseOrderController>(PurchaseOrderController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'getOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsPurchaseOrderController_createOrder: Record<string, TsoaRoute.ParameterSchema> = {
                requestBody: {"in":"body","name":"requestBody","required":true,"ref":"CreatePOParams"},
        };
        app.post('/orders',
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController)),
            ...(fetchMiddlewares<RequestHandler>(PurchaseOrderController.prototype.createOrder)),

            async function PurchaseOrderController_createOrder(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsPurchaseOrderController_createOrder, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<PurchaseOrderController>(PurchaseOrderController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'createOrder',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsHealthController_getHealth: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.getHealth)),

            async function HealthController_getHealth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_getHealth, request, response });

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<HealthController>(HealthController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }

              await templateService.apiHandler({
                methodName: 'getHealth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
