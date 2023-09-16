import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaWithAccelerate = new PrismaClient().$extends(withAccelerate());

export default prismaWithAccelerate;
