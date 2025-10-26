# IWatches - Luxury Watch Distributor Landing Page

Production-ready, fully responsive landing page for IWatches, an independent distributor of Japanese automatic watches.

## Features

- ✨ **Bright & Minimal Design**: Ivory, Pearl, Champagne Gold, and Graphite color palette
- 🎯 **One-Click Catalog Download**: Direct download with optional email capture
- 🔐 **Authentication**: Email/password auth with Better Auth
- 🎁 **Referral System**: Unlock premium catalog after 3 valid referrals
- 📧 **Lead Capture**: Email collection via Resend
- ⭐ **Reviews System**: Verified testimonials with approval workflow
- 🌐 **SEO Optimized**: Metadata, sitemap, robots.txt, JSON-LD schemas
- 🎨 **Smooth Animations**: Framer Motion micro-interactions
- 📱 **Fully Responsive**: Mobile-first design with fluid breakpoints
- ♿ **Accessible**: ARIA labels, focus states, AA contrast
- 🚀 **Performance**: Next.js 15 App Router, image optimization, lazy loading

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Turso (SQLite)
- **ORM**: Drizzle
- **Auth**: Better Auth (email/password)
- **Email**: Resend
- **Styling**: Tailwind CSS + Custom Theme
- **Animations**: Framer Motion
- **UI Components**: shadcn/ui
- **Deployment**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

See `.env.example` for required variables. Key variables:

- `TURSO_CONNECTION_URL` - Already configured
- `TURSO_AUTH_TOKEN` - Already configured
- `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - http://localhost:3000 (dev) or your domain (prod)
- `RESEND_API_KEY` - Get from resend.com
- `RESEND_FROM` - Your verified email

## Deployment

See `DEPLOYMENT.md` for detailed instructions.

Quick deploy to Vercel:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

## Project Structure

```
src/
├── app/              # Next.js pages & API routes
├── components/       # React components
├── db/              # Database schema & config
└── lib/             # Auth & utilities

public/
├── premium.pdf      # Premium catalog
└── robots.txt       # SEO
```

## Key Features

### Catalog Download
- One-click download from Dropbox
- Optional email capture with 5% discount
- Anti-abuse protection (2-hour window)

### Referral System
- Unique code per user
- Track via `?ref=CODE`
- Progress tracking (0/3 to 3/3)
- Premium catalog unlock at 3 referrals

### Reviews
- Carousel with navigation
- Approval workflow
- Pre-seeded with 5 Spanish reviews

## Customization

### Colors
Edit `src/app/globals.css`:
```css
--color-ivory: #F9F9F7;
--color-pearl: #EAEAEA;
--color-champagne: #C6A664;
--color-graphite: #121212;
```

### Catalog Links
- Main: `src/components/CatalogDownload.tsx`
- Premium: `public/premium.pdf`

### WhatsApp
Update number in `src/components/ContactSection.tsx`

## Support

For issues, check:
- Browser console
- Vercel logs
- Environment variables
- `DEPLOYMENT.md` troubleshooting

## License

Proprietary - IWatches 2025