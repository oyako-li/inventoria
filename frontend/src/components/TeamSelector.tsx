import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TeamSelector: React.FC = () => {
  const { currentTeam, teams, setCurrentTeam, getMyTeams, createTeam, inviteMember, getTeamMembers } = useAuth();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    getMyTeams();
  }, []);

  useEffect(() => {
    if (currentTeam) {
      loadTeamMembers();
    }
  }, [currentTeam]);

  const loadTeamMembers = async () => {
    if (currentTeam) {
      const members = await getTeamMembers(currentTeam.id);
      setTeamMembers(members);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      const success = await createTeam(teamName, teamDescription);
      if (success) {
        setShowCreateTeam(false);
        setTeamName('');
        setTeamDescription('');
      }
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTeam && inviteEmail.trim()) {
      const success = await inviteMember(currentTeam.id, inviteEmail, inviteRole);
      if (success) {
        setShowInviteMember(false);
        setInviteEmail('');
        setInviteRole('member');
        loadTeamMembers();
      }
    }
  };

  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="team-selector">
      <div className="team-header">
        <h3>チーム管理</h3>
      </div>

      {/* チームが無い場合の表示 */}
      {teams.length === 0 ? (
        <div className="no-team-section">
          <div className="no-team-content">
            <div className="no-team-icon">👥</div>
            <h4>まだチームに所属していません</h4>
            <p>在庫管理を始めるには、まずチームを作成してください。</p>
            <button 
              onClick={() => setShowCreateTeam(true)}
              className="create-team-btn primary"
            >
              🚀 最初のチームを作成
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="team-actions">
            <button 
              onClick={() => setShowCreateTeam(true)}
              className="create-team-btn"
            >
              ➕ 新しいチームを作成
            </button>
          </div>

          <div className="team-list">
            <h4>所属チーム</h4>
            <div className="team-items">
              {teams.map((team) => (
                <div 
                  key={team.id} 
                  className={`team-item ${currentTeam?.id === team.id ? 'active' : ''}`}
                  onClick={() => setCurrentTeam(team)}
                >
                  <div className="team-info">
                    <h5>{team.name}</h5>
                    <p>{team.description}</p>
                  </div>
                  {currentTeam?.id === team.id && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInviteMember(true);
                      }}
                      className="invite-btn"
                    >
                      メンバーを招待
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {currentTeam && (
            <div className="current-team">
              <h4>現在のチーム: {currentTeam.name}</h4>
              <div className="team-members">
                <h5>メンバー一覧</h5>
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="member-item">
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* チーム作成モーダル */}
      {showCreateTeam && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>新しいチームを作成</h3>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>チーム名 *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  placeholder="チーム名を入力"
                />
              </div>
              <div className="form-group">
                <label>説明（オプション）</label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="チームの説明"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary">作成</button>
                <button type="button" onClick={() => setShowCreateTeam(false)}>
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* メンバー招待モーダル */}
      {showInviteMember && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>メンバーを招待</h3>
            <form onSubmit={handleInviteMember}>
              <div className="form-group">
                <label>メールアドレス *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="招待するユーザーのメールアドレス"
                />
              </div>
              <div className="form-group">
                <label>役割</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="member">メンバー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="primary">招待</button>
                <button type="button" onClick={() => setShowInviteMember(false)}>
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelector; 