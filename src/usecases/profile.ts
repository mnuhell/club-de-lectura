import type { IUserRepository } from '../repositories'
import type { User } from '../domain'

export async function getProfile(repo: IUserRepository, userId: string): Promise<User | null> {
  return repo.getById(userId)
}

export async function updateProfile(
  repo: IUserRepository,
  userId: string,
  data: { displayName: string; bio: string },
): Promise<User> {
  if (!data.displayName.trim()) throw new Error('El nombre no puede estar vacío')
  return repo.update(userId, { displayName: data.displayName.trim(), bio: data.bio })
}
