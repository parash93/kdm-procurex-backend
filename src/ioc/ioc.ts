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
import { DashboardService } from "../services/dashboardService";
import { DashboardController } from "../controllers/dashboardController";
import { AuthService } from "../services/authService";
import { AuthController } from "../controllers/authController";
import { InventoryService } from "../services/inventoryService";
import { InventoryController } from "../controllers/inventoryController";
import { AuditService } from "../services/auditService";
import { AuditController } from "../controllers/auditController";
import { DispatchService } from "../services/dispatchService";
import { DispatchController } from "../controllers/dispatchController";

const iocContainer = new Container();

iocContainer.bind<DispatchService>(DispatchService).toSelf().inSingletonScope();
iocContainer.bind<DispatchController>(DispatchController).toSelf().inSingletonScope();

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
// TrackingService and TrackingController removed
iocContainer.bind<DashboardService>(DashboardService).toSelf().inSingletonScope();
iocContainer.bind<DashboardController>(DashboardController).toSelf().inSingletonScope();
iocContainer.bind<AuthService>(AuthService).toSelf().inSingletonScope();
iocContainer.bind<AuthController>(AuthController).toSelf().inSingletonScope();
iocContainer.bind<InventoryService>(InventoryService).toSelf().inSingletonScope();
iocContainer.bind<InventoryController>(InventoryController).toSelf().inSingletonScope();
iocContainer.bind<AuditService>(AuditService).toSelf().inSingletonScope();
iocContainer.bind<AuditController>(AuditController).toSelf().inSingletonScope();

export { iocContainer };
