import { ImageResponse } from 'next/og';
import { storage } from '../../../../lib/storage';

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const idOrSlug = searchParams.get('id') || searchParams.get('slug');
	if (!idOrSlug) return new Response('Missing id', { status: 400 });
	const game = await storage.getGameById(idOrSlug).catch(() => undefined);
	if (!game) return new Response('Not found', { status: 404 });

	const title = game.title || 'Game';
	const tagline = (game.description || '').slice(0, 90);
	return new ImageResponse(
		(
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					width: '100%',
					height: '100%',
					background: 'linear-gradient(135deg,#0d1117,#1d2230)',
					color: 'white',
					padding: '48px',
					fontFamily: 'system-ui, sans-serif',
					justifyContent: 'space-between',
					position: 'relative',
				}}
			>
				<div style={{ fontSize: 54, fontWeight: 600, lineHeight: 1.1 }}>{title}</div>
				<div style={{ fontSize: 24, opacity: 0.7 }}>{tagline}</div>
				<div style={{ display: 'flex', gap: 12, fontSize: 18 }}>
					{Array.isArray(game.genre) && game.genre.slice(0, 3).map((g) => (
						<span key={g} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 999 }}>{g}</span>
					))}
				</div>
				<div style={{ position: 'absolute', top: 24, right: 40, fontSize: 28, fontWeight: 600, background: 'linear-gradient(90deg,#6366f1,#ec4899)', WebkitBackgroundClip: 'text', color: 'transparent' }}>Arcade</div>
			</div>
		),
		{ width: 1200, height: 630 }
	);
}
