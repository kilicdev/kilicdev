import React from 'react';

const HeaderLayout = () => {
  return (
    <header className="header-body" id="top">
      <div className="terminal-inline-command">
        <span className="terminal-prompt">$</span>
        <span>cat profile.sys</span>
      </div>
      <div className="header-brand">
        <img alt="logo" src="/libs/bucksh0t.png" className="brand-avatar" />
        <div>
          <div className="brand-title-line">
            <span className="brand-title">bucksh0t</span>
            <span className="brand-badge">root</span>
          </div>
          <div className="brand-subtitle">software architect</div>
        </div>
      </div>
      <div className="header-meta">
        <span>firewall: armed</span>
        <span>stack: full-stack</span>
        <span>trace: obfuscated</span>
        <span>response: instant</span>
      </div>
    </header>
  );
};

export default HeaderLayout;
