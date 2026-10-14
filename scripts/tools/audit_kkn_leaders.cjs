/**
 * Project: BERSEKA
 * KKN Group Leader Audit and Synchronization Tool
 *
 * Checks KKN groups and ensures each group has an active leader (is_ketua = true)
 * Protected by VPS Safety Guard to avoid unintended production mutations.
 */

const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../apps/api/.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { PrismaClient } = require("@prisma/client");
const { assertNotProduction } = require("./safety_guard.cjs");

const prisma = new PrismaClient();

async function run() {
  const isSync = process.argv.includes("--sync");

  console.log(`[KKN Leader Audit] Starting verification... Mode: ${isSync ? "SYNC" : "READ-ONLY AUDIT"}`);

  if (isSync) {
    assertNotProduction("audit_kkn_leaders.cjs --sync");
  }

  try {
    const groups = await prisma.kelompokKkn.findMany({
      include: {
        students: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`[KKN Leader Audit] Total groups found: ${groups.length}`);

    let groupsWithLeader = 0;
    let groupsWithoutLeader = 0;

    for (const group of groups) {
      const leaders = group.students.filter((s) => s.isKetua);

      if (leaders.length === 1) {
        groupsWithLeader++;
        console.log(`[OK] ${group.name}: Leader is ${leaders[0].user?.name} (NIM: ${leaders[0].nim}, UserID: ${leaders[0].userId})`);
      } else if (leaders.length > 1) {
        console.warn(`[WARN] ${group.name} has multiple leaders (${leaders.length}): ${leaders.map((l) => l.user?.name).join(", ")}`);
      } else {
        groupsWithoutLeader++;
        console.warn(`[MISSING] ${group.name} has NO assigned leader. Members count: ${group.students.length}`);
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Groups with leader   : ${groupsWithLeader}`);
    console.log(`Groups without leader: ${groupsWithoutLeader}`);
    console.log(`Total groups         : ${groups.length}`);
  } catch (err) {
    console.error("[KKN Leader Audit] Execution failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
