import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidTimezone } from '@/lib/timezone';

/**
 * Get the timezone for the current authenticated user
 * @returns User's timezone string or 'UTC' as default
 */
export async function getUserTimezone(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return 'UTC';
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true }
    });
    
    return user?.timezone || 'UTC';
  } catch (error) {
    console.error('Error fetching user timezone:', error);
    return 'UTC';
  }
}

/**
 * Get timezone for a specific user by ID
 * @param userId - User ID
 * @returns User's timezone string or 'UTC' as default
 */
export async function getUserTimezoneById(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true }
    });
    
    return user?.timezone || 'UTC';
  } catch (error) {
    console.error('Error fetching user timezone by ID:', error);
    return 'UTC';
  }
}

/**
 * Update user's timezone preference
 * @param userId - User ID
 * @param timezone - New timezone string
 */
export async function updateUserTimezone(userId: string, timezone: string): Promise<void> {
  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: ${timezone}`);
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { timezone }
  });
}
