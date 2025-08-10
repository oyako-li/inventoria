import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiRequest, setLogoutCallback } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface TeamMember {
  user_id: number;
  name: string;
  email: string;
  role: string;
  joined_at?: string;
}

interface AuthContextType {
  user: User | null;
  currentTeam: Team | null;
  teams: Team[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  createTeam: (name: string, description?: string) => Promise<boolean>;
  getMyTeams: () => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  inviteMember: (teamId: number, email: string, role?: string) => Promise<boolean>;
  getTeamMembers: (teamId: number) => Promise<TeamMember[]>;
  getAuthHeaders: () => { [key: string]: string };
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ページ読み込み時に認証状態をチェック
    checkAuthStatus();
    
    // apiRequestにログアウトコールバックを登録
    setLogoutCallback(() => {
      logout();
    });
  }, []);

  useEffect(() => {
    // 認証後にチーム情報を取得
    if (user) {
      getMyTeams();
    }
  }, [user]);

  useEffect(() => {
    // チームが取得されたら、選択されていない場合は最初のチームを自動選択
    if (teams.length > 0 && !currentTeam) {
      setCurrentTeam(teams[0]);
    }
  }, [teams, currentTeam]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await apiRequest('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('認証状態の確認に失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('ログインに失敗しました:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setCurrentTeam(null);
    setTeams([]);
    
    // ログイン画面にリダイレクト
    window.location.href = '/login';
  };

  const createTeam = async (name: string, description?: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiRequest('/api/teams/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description }),
      });

      if (response.ok) {
        await getMyTeams();
        return true;
      }
      return false;
    } catch (error) {
      console.error('チーム作成に失敗しました:', error);
      return false;
    }
  };

  const getMyTeams = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiRequest('/api/teams/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('チーム取得に失敗しました:', error);
    }
  };

  const inviteMember = async (teamId: number, email: string, role?: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiRequest(`/api/teams/${teamId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, role }),
      });

      return response.ok;
    } catch (error) {
      console.error('メンバー招待に失敗しました:', error);
      return false;
    }
  };

  const getTeamMembers = async (teamId: number): Promise<TeamMember[]> => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await apiRequest(`/api/teams/${teamId}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.members;
      }
      return [];
    } catch (error) {
      console.error('チームメンバー取得に失敗しました:', error);
      return [];
    }
  };

  const getAuthHeaders = (): { [key: string]: string } => {
    const token = localStorage.getItem('authToken');
    // console.log("getAuthHeaders - token:", token ? "exists" : "not found");
    // console.log("getAuthHeaders - currentTeam:", currentTeam);
    // console.log("getAuthHeaders - teams:", teams);
    
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (currentTeam) {
      headers['X-Team-ID'] = currentTeam.id.toString();
    } else if (teams.length > 0) {
      // チームが選択されていない場合は最初のチームを自動選択
      headers['X-Team-ID'] = teams[0].id.toString();
    }
    
    console.log("getAuthHeaders - final headers:", headers);
    return headers;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('登録に失敗しました:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    currentTeam,
    teams,
    login,
    logout,
    register,
    createTeam,
    getMyTeams,
    setCurrentTeam,
    inviteMember,
    getTeamMembers,
    getAuthHeaders,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 