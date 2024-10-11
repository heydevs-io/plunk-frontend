import { ChildControllers, Controller } from "@overnightjs/core";
import { Users } from "./Users";

@Controller("internal")
@ChildControllers([new Users()])
export class Internal {}