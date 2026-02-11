import { Container } from "inversify";
import "reflect-metadata";
import { SupplierService } from "../services/supplierService";
import { SupplierController } from "../controllers/supplierController";
import { HealthController } from "../controllers/healthController";
import { PurchaseOrderService } from "../services/poService";
import { PurchaseOrderController } from "../controllers/poController";
import { DivisionService } from "../services/divisionService";
import { DivisionController } from "../controllers/divisionController";
import { ProductCategoryService } from "../services/productCategoryService";
import { ProductCategoryController } from "../controllers/productCategoryController";
import { ProductService } from "../services/productService";
import { ProductController } from "../controllers/productController";
import { UserService } from "../services/userService";
import { UserController } from "../controllers/userController";
import { ApprovalService } from "../services/approvalService";
import { ApprovalController } from "../controllers/approvalController";
import { TrackingService } from "../services/trackingService";
import { TrackingController } from "../controllers/trackingController";
import { DashboardService } from "../services/dashboardService";
import { DashboardController } from "../controllers/dashboardController";
import { AuthService } from "../services/authService";
import { AuthController } from "../controllers/authController";

const iocContainer = new Container();

iocContainer.bind<SupplierService>(SupplierService).toSelf().inSingletonScope();
iocContainer.bind<SupplierController>(SupplierController).toSelf().inSingletonScope();
iocContainer.bind<HealthController>(HealthController).toSelf().inSingletonScope();
iocContainer.bind<PurchaseOrderService>(PurchaseOrderService).toSelf().inSingletonScope();
iocContainer.bind<PurchaseOrderController>(PurchaseOrderController).toSelf().inSingletonScope();

iocContainer.bind<DivisionService>(DivisionService).toSelf().inSingletonScope();
iocContainer.bind<DivisionController>(DivisionController).toSelf().inSingletonScope();
iocContainer.bind<ProductCategoryService>(ProductCategoryService).toSelf().inSingletonScope();
iocContainer.bind<ProductCategoryController>(ProductCategoryController).toSelf().inSingletonScope();
iocContainer.bind<ProductService>(ProductService).toSelf().inSingletonScope();
iocContainer.bind<ProductController>(ProductController).toSelf().inSingletonScope();

iocContainer.bind<UserService>(UserService).toSelf().inSingletonScope();
iocContainer.bind<UserController>(UserController).toSelf().inSingletonScope();
iocContainer.bind<ApprovalService>(ApprovalService).toSelf().inSingletonScope();
iocContainer.bind<ApprovalController>(ApprovalController).toSelf().inSingletonScope();
iocContainer.bind<TrackingService>(TrackingService).toSelf().inSingletonScope();
iocContainer.bind<TrackingController>(TrackingController).toSelf().inSingletonScope();
iocContainer.bind<DashboardService>(DashboardService).toSelf().inSingletonScope();
iocContainer.bind<DashboardController>(DashboardController).toSelf().inSingletonScope();
iocContainer.bind<AuthService>(AuthService).toSelf().inSingletonScope();
iocContainer.bind<AuthController>(AuthController).toSelf().inSingletonScope();

export { iocContainer };
