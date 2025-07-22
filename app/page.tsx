import prisma from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.user.findMany();
  console.log(users);

  return (
      <div>
        NEXT APP
      </div>
  );
}
