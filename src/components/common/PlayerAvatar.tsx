import React, { useState } from 'react';

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ name, avatarUrl, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'J';

  return (
    <span className={`shrink-0 overflow-hidden rounded-full bg-violet-100 text-violet-700 grid place-items-center font-black ${className}`.trim()}>
      {avatarUrl && !failed
        ? <img src={avatarUrl} alt={`Foto de ${name}`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : <span aria-label={`Iniciais de ${name}`}>{initials}</span>}
    </span>
  );
};
