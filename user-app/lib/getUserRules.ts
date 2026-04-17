import { prisma } from "@/prisma"
import { unstable_cache } from "next/cache"

const getUserRules = async (userId: string) => {
    return await unstable_cache(
        async () => {
            try {
                const dbRules = await prisma.customRule.findMany({
                    where: { userId, isActive: true },
                    select: { ruleText: true }
                })
                return dbRules.map(r => r.ruleText)
            } catch (error) {
                console.error("Error fetching user rules:", error)
                return []
            }
        }, [userId], {
        tags: ["userRule-" + userId],
        revalidate: 7200
    })()
}

export { getUserRules }