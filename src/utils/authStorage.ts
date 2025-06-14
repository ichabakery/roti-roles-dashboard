
import { User } from '@/contexts/AuthContext';

export const getCachedUser = (): User | null => {
  try {
    const cachedUser = localStorage.getItem("bakeryUser");
    if (cachedUser) {
      return JSON.parse(cachedUser) as User;
    }
    return null;
  } catch (error) {
    console.error('Error parsing cached user:', error);
    return null;
  }
};

export const setCachedUser = (user: User): void => {
  localStorage.setItem("bakeryUser", JSON.stringify(user));
};

export const removeCachedUser = (): void => {
  localStorage.removeItem("bakeryUser");
};
