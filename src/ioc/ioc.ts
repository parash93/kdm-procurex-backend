import { Container } from "inversify";
import "reflect-metadata";
import { SupplierService } from "../services/supplierService";
import { SupplierController } from "../controllers/supplierController";
import { HealthController } from "../controllers/healthController";
import { PurchaseOrderService } from "../services/poService";
import { PurchaseOrderController } from "../controllers/poController";

const iocContainer = new Container();

iocContainer.bind<SupplierService>(SupplierService).toSelf().inSingletonScope();
iocContainer.bind<SupplierController>(SupplierController).toSelf().inSingletonScope();
iocContainer.bind<HealthController>(HealthController).toSelf().inSingletonScope();
iocContainer.bind<PurchaseOrderService>(PurchaseOrderService).toSelf().inSingletonScope();
iocContainer.bind<PurchaseOrderController>(PurchaseOrderController).toSelf().inSingletonScope();

export { iocContainer };
