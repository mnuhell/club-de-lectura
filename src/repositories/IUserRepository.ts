import type { User } from '../domain'

export interface IUserRepository {
  getById(id: string): Promise<User | null>
  getByUsername(username: string): Promise<User | null>
  update(id: string, data: Partial<Pick<User, 'displayName' | 'bio' | 'avatarUrl'>>): Promise<User>
}
