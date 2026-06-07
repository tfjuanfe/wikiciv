// Create (or promote) an archivist account. Run against the production database
// to bootstrap the first admin, since production ships with NO seeded accounts.
//
// Usage:
//   npm run create-admin -- <username> <password>
// or via env:
//   ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run create-admin
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

async function main() {
  const username = (process.argv[2] ?? process.env.ADMIN_USERNAME ?? "").trim();
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? "";

  if (!USERNAME_RE.test(username)) {
    console.error("Usage: npm run create-admin -- <username> <password>");
    console.error("Username must be 3-20 letters, numbers, or underscores.");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { username },
    update: { role: "archivist", trusted: true, passwordHash },
    create: { username, passwordHash, role: "archivist", trusted: true },
  });

  console.log(`Archivist ready: ${user.username} (id ${user.id})`);
  console.log("You can now log in and start creating servers and events.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
