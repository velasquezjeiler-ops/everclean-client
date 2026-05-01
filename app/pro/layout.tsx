  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 160, height: 160, background: 'radial-gradient(circle, rgba(76,175,80,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <Image src="/logo.jpg" alt="EverClean" width={40} height={40} style={{ borderRadius: 11, boxShadow: '0 3px 10px rgba(0,0,0,0.3)', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
              Ever<span style={{ color: C.green }}>Clean</span>
            </div>
            <div style={{ fontSize: 9, color: `${C.green}bb`, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Pro Portal
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhotoUpload initials={proInitials} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {proName || 'Professional'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {rating && (
                <>
                  <IC.Star s={10} />
                  <span style={{ fontSize: 10, color: '#fff', opacity: 0.7 }}>{rating.toFixed(1)}</span>
                </>
              )}
              <IC.Shield c={C.green} s={10} />
              <span style={{ fontSize: 9, color: `${C.green}cc`, fontWeight: 600 }}>VERIFIED</span>
            </div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: isAvailable ? C.green : C.muted, boxShadow: isAvailable ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }} />
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '11px 12px',
                    borderRadius: 12,
                    background: active ? 'rgba(255,255,255,0.16)' : 'transparent',
                    border: active ? '1px solid rgba(255,255,255,0.16)' : '1px solid transparent',
                    color: '#fff',
                    boxShadow: active ? '0 8px 24px rgba(0,0,0,0.16)' : 'none',
                    transition: 'background 0.15s, border 0.15s',
                  }}
                >
                  <Icon c={active ? '#fff' : 'rgba(255,255,255,0.72)'} s={19} />
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.72)' }}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            borderRadius: 12,
            padding: '11px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <IC.Logout s={16} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="pro-layout-root">
      <style>{`
        .pro-layout-root {
          min-height: 100vh;
          background: ${C.bg};
          color: ${C.text};
        }

        .pro-sidebar-desktop {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 244px;
          z-index: 40;
          background: ${sidebarBg};
          box-shadow: 8px 0 28px rgba(13, 55, 129, 0.16);
        }

        .pro-mobile-header {
          display: none;
        }

        .pro-mobile-drawer-backdrop {
          display: none;
        }

        .pro-page-frame {
          min-height: 100vh;
          margin-left: 244px;
        }

        .pro-content-shell {
          width: 100%;
          max-width: 1460px;
          margin: 0 auto;
          padding: 24px 20px 40px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 20px;
          align-items: start;
        }

        .pro-main {
          min-width: 0;
          width: 100%;
        }

        .pro-right-desktop {
          width: 300px;
          position: sticky;
          top: 20px;
        }

        @media (max-width: 1180px) {
          .pro-content-shell {
            grid-template-columns: minmax(0, 1fr);
            max-width: 980px;
          }

          .pro-right-desktop {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .pro-sidebar-desktop {
            display: none;
          }

          .pro-mobile-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 56px;
            z-index: 60;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 14px;
            background: ${sidebarBg};
            box-shadow: 0 6px 18px rgba(13, 55, 129, 0.18);
          }

          .pro-page-frame {
            margin-left: 0;
          }

          .pro-content-shell {
            margin-left: 0;
            padding: 72px 14px 80px;
            display: block;
            max-width: none;
          }

          .pro-mobile-drawer-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 80;
            background: rgba(8, 31, 74, 0.42);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s ease;
          }

          .pro-mobile-drawer-backdrop.open {
            opacity: 1;
            pointer-events: auto;
          }

          .pro-mobile-drawer {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(86vw, 300px);
            background: ${sidebarBg};
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 12px 0 32px rgba(0,0,0,0.24);
          }

          .pro-mobile-drawer.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <aside className="pro-sidebar-desktop">
        <SidebarContent />
      </aside>

      <header className="pro-mobile-header">
        <button
          onClick={() => setMenuOpen(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Open menu"
        >
          <IC.Menu />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Image src="/logo.jpg" alt="EverClean" width={32} height={32} style={{ borderRadius: 9 }} />
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>
            Ever<span style={{ color: C.green }}>Clean</span>
          </div>
        </div>

        <PhotoUpload initials={proInitials} />
      </header>

      <div className={`pro-mobile-drawer-backdrop ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
        <div className={`pro-mobile-drawer ${menuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <SidebarContent />
        </div>
      </div>

      <div className="pro-page-frame">
        <div className="pro-content-shell">
          <main className="pro-main">{children}</main>

          <aside className="pro-right-desktop">
            <RightPanel
              bookings={bookings}
              selectedBooking={selectedBooking}
              onSelectBooking={setSelectedBooking}
            />
          </aside>
        </div>
      </div>

      {selectedBooking && (
        <AddressMapCard booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
