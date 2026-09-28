# Phase 0A: Landing Page — Implementation Plan

## Goal Description

Membangun landing page yang modern, profesional, dan engaging untuk platform Muadalah sebagai first impression dan entry point bagi calon users. Landing page harus showcase fitur utama, build trust, dan drive conversion ke login/sign up.

**Background Context:**
- Frontend design reference tersedia di `frontend/stitch_muadalah_school_management_system/landing_page_muadalah/code.html`
- Target audience: Admin sekolah, kepala sekolah, dan decision makers
- Goals: Brand awareness, trust building, lead generation
- Next.js 14+ App Router dengan Server Components untuk optimal performance
- SEO-optimized untuk organic discovery
- Modern design dengan glassmorphism, gradients, dan smooth animations

**What This Change Accomplishes:**
- Professional public-facing homepage
- Clear value proposition dan benefits
- Feature showcase dengan visual elements
- Trust indicators (stats, testimonials placeholder)
- Strong call-to-action untuk conversion
- Responsive mobile-first design
- Fast loading performance (Lighthouse 90+)
- SEO optimized dengan proper meta tags
- Accessible untuk semua users (WCAG 2.2 AA)

---

## User Review Required

> [!IMPORTANT]
> **Content Strategy:**
> - Landing page akan menggunakan **Bahasa Indonesia** penuh
> - Tone: Professional, trustworthy, modern
> - Focus pada benefits untuk sekolah (efisiensi, transparansi, modernisasi)
> - Perlu foto/ilustrasi berkualitas tinggi untuk visual appeal

> [!IMPORTANT]
> **SEO & Meta Tags:**
> - Page title: "Muadalah - Sistem Manajemen Sekolah Modern"
> - Meta description: ~155 karakter tentang platform
> - Open Graph tags untuk social sharing
> - Structured data untuk Google Rich Results

> [!WARNING]
> **Image Assets:**
> - Hero image: Modern classroom/school environment
> - Feature icons: Material Symbols (consistent dengan design system)
> - About section: 2 images (UI mockup + teacher/student)
> - Apakah akan menggunakan stock photos atau custom photography?
> - **Recommendation:** Use high-quality stock photos dari Unsplash/Pexels untuk MVP

---

## Open Questions

> [!IMPORTANT]
> **Navigation Menu:**
> 1. Apakah perlu tambahan pages selain Home (Features, About, Contact)?
>    - **Recommendation:** Start dengan single-page landing (scroll to sections)
>    - Future: Separate pages jika content bertambah banyak
>
> 2. Apakah perlu "Request Demo" form atau langsung ke login?
>    - **Recommendation:** Button "Mulai Transformasi" → direct to login/register

> [!IMPORTANT]
> **Analytics & Tracking:**
> - Apakah perlu Google Analytics atau analytics tool lain?
> - **Recommendation:** Add GA4 untuk track conversions dan user behavior
> - Privacy-compliant (GDPR-ready dengan cookie consent)

---

## Proposed Changes

### Component 1: Landing Page Structure

#### [NEW] [page.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/page.tsx)
- **Root landing page (Server Component)**
- **Design berdasarkan `landing_page_muadalah/code.html`**
- Sections:
  1. **Hero Section** - Main value proposition
  2. **Features Section** - 5 key features
  3. **About Section** - Platform details
  4. **CTA Section** - Final conversion push
- Structure:
  ```tsx
  <main>
    <HeroSection />
    <FeaturesSection />
    <AboutSection />
    <CTASection />
  </main>
  ```
- Metadata export untuk SEO
- Smooth scroll behavior untuk internal links

#### [NEW] [layout.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/app/layout.tsx)
- Root layout dengan:
  - HTML lang="id" (Bahasa Indonesia)
  - SEO meta tags
  - Font loading (Inter dari Google Fonts)
  - Global CSS imports
  - Analytics scripts (optional)
- Structure:
  ```tsx
  <html lang="id">
    <head>
      <SEO metadata />
      <Fonts />
    </head>
    <body>
      <Header />
      {children}
      <Footer />
    </body>
  </html>
  ```

---

### Component 2: Header Component

#### [NEW] [header.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/layout/header.tsx)
- Fixed header dengan backdrop blur
- Components:
  - **Logo** (Muadalah branding dengan icon)
  - **Navigation Links** (Home, Features, About, Contact)
  - **Login Button** (primary CTA)
  - **Mobile Menu Toggle** (hamburger icon)
- Features:
  - Sticky header yang muncul saat scroll down
  - Active state untuk current section
  - Smooth scroll to section anchors
  - Mobile responsive (hamburger menu)
  - Accessibility (keyboard navigation, ARIA labels)
- Styling:
  - Background: `bg-surface/80 backdrop-blur-xl`
  - Shadow: `shadow-sm`
  - Height: 80px (h-20)
  - Max width: 7xl dengan centered content

---

### Component 3: Hero Section

#### [NEW] [hero-section.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/hero-section.tsx)
- **Above-the-fold content (most important)**
- Components:
  - **Badge** - "Platform Modern" dengan animated pulse dot
  - **Headline** - H1 dengan gradient text effect
    - "Transformasi Digital"
    - "Manajemen Pendidikan Muadalah" (gradient)
  - **Subheadline** - Value proposition (body-lg)
  - **CTA Buttons:**
    - Primary: "Mulai Transformasi Sekarang" → `/login`
    - Secondary: "Pelajari Lebih Lanjut" → scroll to features
  - **Mini Stats** - Social proof (1000+ siswa, 50+ guru, 2 lembaga)
  - **Hero Image** - Modern school environment dengan overlay
  - **Floating UI Element** - Animated card "Absensi Harian Selesai"
- Layout:
  - 2-column grid pada desktop (text left, image right)
  - Single column pada mobile (text first, image below)
- Animations:
  - Fade in on mount dengan Framer Motion
  - Floating card bounces gently (infinite loop)
  - Gradient text shimmer effect
- Decorative elements:
  - Background gradient blob (blur-3xl)
  - Subtle grid pattern

---

### Component 4: Features Section

#### [NEW] [features-section.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/features-section.tsx)
- **Feature showcase dengan cards**
- Components:
  - Section header dengan title + description
  - Grid layout (3 columns desktop, 1 column mobile)
  - 5 feature cards:
    1. **Manajemen Siswa** - Icon: `group`
    2. **Absensi Digital** - Icon: `fact_check`
    3. **Penilaian Akademik** - Icon: `school`
    4. **Pembayaran SPP** - Icon: `payments`
    5. **Komunikasi Terintegrasi** - Icon: `forum` (large card, 2 columns)
- Feature Card structure:
  - Icon container dengan hover color change
  - Title (headline-sm)
  - Description (body-sm)
  - Hover effects (shadow, border color, background gradient)
  - Decorative corner gradient
- Special: Card #5 (Komunikasi) is larger dengan gradient background dan decorative SVG
- Animations:
  - Cards stagger fade in on scroll
  - Hover scale up slightly

---

### Component 5: About Section

#### [NEW] [about-section.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/about-section.tsx)
- **Platform details dan trust building**
- Components:
  - **Image Grid** (left side)
    - 2 images dalam 2-column grid
    - Image 1: UI mockup (dashboard screenshot)
    - Image 2: Teacher with tablet (offset dengan mt-8)
    - Decorative dots pattern di corner
  - **Content** (right side)
    - Label: "TENTANG SISTEM"
    - Title: "Solusi Manajemen Komprehensif untuk SMP & SMA"
    - Description paragraph
    - **Feature List** dengan checkmark icons:
      - "Dirancang sesuai standar kurikulum nasional"
      - "Skalabilitas tinggi"
      - "Keamanan data terjamin"
    - **Trust Indicator** (avatars + text)
      - Stack of user avatars
      - "+99" badge
      - "Dipercaya oleh administrator sekolah..."
- Layout:
  - 2-column grid pada desktop
  - Single column pada mobile
- Animations:
  - Images parallax effect on scroll
  - Content fade in from left

---

### Component 6: CTA Section

#### [NEW] [cta-section.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/cta-section.tsx)
- **Final conversion push**
- Design:
  - Large card dengan gradient background (primary to surface-tint)
  - Centered text layout
  - Background pattern (diagonal stripes, low opacity)
- Content:
  - Title: "Siap Meningkatkan Mutu Sekolah Anda?"
  - Description: Invitation untuk demo
  - CTA Button: "Mulai Transformasi Sekarang" → `/login`
- Styling:
  - Rounded-[2rem] untuk modern look
  - Shadow-xl untuk depth
  - White text on gradient background
  - Button: white background dengan primary text
- Animation:
  - Background pattern animated (subtle shift)
  - Button hover scale

---

### Component 7: Footer Component

#### [NEW] [footer.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/layout/footer.tsx)
- **Site footer dengan navigation dan legal**
- Sections:
  - **Brand Column:**
    - Muadalah logo + name
    - Tagline: "Modernizing Islamic educational administration..."
  - **Product Column:**
    - Features link
    - Pricing link (future)
  - **Support Column:**
    - Help Center link
    - Contact Us link
  - **Copyright Bar** (bottom)
    - "© 2024 Muadalah Management System. All rights reserved."
- Layout:
  - 3-column grid pada desktop
  - Single column pada mobile
- Styling:
  - Background: surface-container-low
  - Border-top: subtle border
  - Padding: xl vertical, margin-mobile/desktop horizontal

---

### Component 8: Reusable Components

#### [NEW] [feature-card.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/feature-card.tsx)
- Reusable feature card component
- Props:
  - `icon: string` - Material Symbol icon name
  - `title: string` - Feature title
  - `description: string` - Feature description
  - `variant?: 'default' | 'gradient'` - Card style
  - `className?: string` - Additional styles
- Features:
  - Hover effects
  - Icon color transition
  - Decorative gradient corner

#### [NEW] [section-header.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/landing/section-header.tsx)
- Reusable section header
- Props:
  - `title: string`
  - `description?: string`
  - `align?: 'left' | 'center'`
- Consistent styling across sections

#### [NEW] [cta-button.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/shared/cta-button.tsx)
- Reusable CTA button dengan animations
- Props:
  - `children: ReactNode`
  - `href?: string` - Link destination
  - `onClick?: () => void` - Click handler
  - `variant?: 'primary' | 'secondary'`
  - `icon?: string` - Trailing icon
- Features:
  - Hover animations (shadow, scale)
  - Loading state
  - Accessible (keyboard, screen reader)

---

### Component 9: SEO & Metadata

#### [NEW] [metadata.ts](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/lib/metadata.ts)
- Centralized metadata configuration
- Exports:
  - `defaultMetadata` - Base metadata untuk all pages
  - `generatePageMetadata(page)` - Generate metadata untuk specific page
- Content:
  ```typescript
  {
    title: "Muadalah - Sistem Manajemen Sekolah Modern",
    description: "Platform terintegrasi untuk mengelola operasional sekolah SMP & SMA. Manajemen siswa, absensi digital, penilaian, SPP, dan komunikasi dalam satu sistem.",
    keywords: ["sistem manajemen sekolah", "admin sekolah", "SMP", "SMA", "absensi digital"],
    openGraph: {
      title: "...",
      description: "...",
      images: ["/og-image.png"],
      locale: "id_ID"
    },
    twitter: {
      card: "summary_large_image",
      title: "...",
      description: "...",
      images: ["/og-image.png"]
    }
  }
  ```

#### [NEW] [structured-data.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/seo/structured-data.tsx)
- JSON-LD structured data untuk SEO
- Types:
  - Organization schema
  - WebSite schema
  - SoftwareApplication schema
- Helps Google understand the content

---

### Component 10: Image Assets

#### [NEW] [public/images/](file:///c:/Users/ThinkPad/Downloads/Muadalah/public/images/)
- Landing page images:
  - `hero-image.jpg` - Modern classroom/school (high quality)
  - `dashboard-mockup.png` - UI screenshot untuk about section
  - `teacher-tablet.jpg` - Teacher using platform
  - `og-image.png` - Open Graph image untuk social sharing (1200x630)
  - `logo.svg` - Muadalah logo
  - `favicon.ico` - Browser tab icon
- Optimization:
  - Next.js Image component untuk lazy loading
  - WebP format untuk smaller file size
  - Responsive images (srcset)
  - Alt text untuk accessibility

---

### Component 11: Animations & Interactions

#### [NEW] [scroll-animations.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/animations/scroll-animations.tsx)
- Scroll-triggered animations dengan Framer Motion
- Utilities:
  - `FadeInWhenVisible` - Fade in on scroll into view
  - `SlideInWhenVisible` - Slide in from direction
  - `StaggerChildren` - Stagger child animations
- Usage:
  ```tsx
  <FadeInWhenVisible>
    <FeatureCard />
  </FadeInWhenVisible>
  ```

#### [NEW] [hover-effects.css](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/styles/hover-effects.css)
- Custom CSS for hover effects
- Effects:
  - Smooth transitions
  - Shadow depth changes
  - Scale transforms
  - Color transitions

---

### Component 12: Mobile Menu

#### [NEW] [mobile-menu.tsx](file:///c:/Users/ThinkPad/Downloads/Muadalah/src/components/layout/mobile-menu.tsx)
- Mobile navigation menu (hamburger)
- Features:
  - Slide-in from right
  - Backdrop overlay
  - Close on link click
  - Close on outside click
  - Close on Escape key
  - Smooth animations
- Content:
  - Same links as desktop nav
  - Login button
  - Social links (optional)
- Accessible:
  - Focus trap when open
  - ARIA labels
  - Keyboard navigation

---

## Verification Plan

### Automated Tests

```bash
# Component tests
npm test src/components/landing
npm test src/components/layout

# E2E tests
npx playwright test e2e/landing
```

### Manual Verification

1. **Visual Design:**
   - Compare dengan HTML reference
   - Check colors, spacing, typography
   - Verify gradient effects
   - Check animations smoothness

2. **Responsive Design:**
   - Test mobile (375px, 414px)
   - Test tablet (768px, 1024px)
   - Test desktop (1440px, 1920px)
   - Verify no horizontal scroll
   - Check image scaling

3. **Navigation:**
   - Click all header links
   - Verify smooth scroll to sections
   - Test mobile menu open/close
   - Test Login button → `/login`
   - Test all CTA buttons

4. **Performance:**
   - Run Lighthouse audit
   - Target scores:
     - Performance: 90+
     - Accessibility: 95+
     - Best Practices: 95+
     - SEO: 100
   - Check First Contentful Paint (FCP) < 1.5s
   - Check Largest Contentful Paint (LCP) < 2.5s
   - Check Cumulative Layout Shift (CLS) < 0.1

5. **SEO:**
   - View page source
   - Verify meta tags present
   - Check structured data (JSON-LD)
   - Test social sharing preview (Facebook, Twitter)
   - Verify canonical URL
   - Check robots.txt allows indexing

6. **Accessibility:**
   - Test keyboard navigation (Tab through all interactive elements)
   - Test screen reader (NVDA/JAWS)
   - Verify ARIA labels
   - Check focus indicators
   - Verify color contrast (WCAG AA)
   - Check alt text pada images

7. **Cross-browser:**
   - Chrome
   - Firefox
   - Safari
   - Edge
   - Mobile browsers (Chrome, Safari iOS)

8. **Animations:**
   - Verify fade-in animations trigger on scroll
   - Check hero section animations on load
   - Test floating card animation (smooth bounce)
   - Verify hover effects on cards
   - Check button hover states

---

## Implementation Sequence

### Phase 1: Setup & Layout (1 hour)
1. Create root layout (`app/layout.tsx`)
2. Setup global CSS dan design tokens
3. Configure fonts (Inter from Google Fonts)
4. Create Header component
5. Create Footer component
6. Test basic layout structure

### Phase 2: Reusable Components (1-2 hours)
1. Create FeatureCard component
2. Create SectionHeader component
3. Create CTAButton component
4. Create scroll animation utilities
5. Write component tests

### Phase 3: Hero Section (1-2 hours)
1. Create HeroSection component
2. Implement headline dengan gradient
3. Add CTA buttons
4. Add hero image dengan overlay
5. Create floating UI element
6. Add mini stats
7. Implement animations
8. Test responsive design

### Phase 4: Features Section (1-2 hours)
1. Create FeaturesSection component
2. Create 5 feature cards
3. Implement grid layout
4. Add hover effects
5. Special styling untuk large card
6. Add scroll animations
7. Test responsive grid

### Phase 5: About Section (1-2 hours)
1. Create AboutSection component
2. Setup image grid
3. Add content (title, description, list)
4. Add trust indicator (avatars)
5. Add decorative dots
6. Implement parallax effect
7. Test responsive layout

### Phase 6: CTA Section (30 min)
1. Create CTASection component
2. Add gradient background
3. Add pattern overlay
4. Add CTA button
5. Test animations

### Phase 7: Mobile Menu (1 hour)
1. Create MobileMenu component
2. Implement slide-in animation
3. Add backdrop overlay
4. Handle close interactions
5. Add accessibility features
6. Test on mobile devices

### Phase 8: SEO & Metadata (1 hour)
1. Create metadata configuration
2. Add Open Graph tags
3. Add Twitter Card tags
4. Create structured data (JSON-LD)
5. Add favicon dan app icons
6. Test social sharing previews

### Phase 9: Images & Assets (1-2 hours)
1. Select and optimize images
2. Add images to public folder
3. Implement Next.js Image components
4. Add alt text
5. Test image loading performance
6. Generate OG image

### Phase 10: Polish & Optimization (2-3 hours)
1. Run Lighthouse audit
2. Optimize performance issues
3. Add loading skeletons (optional)
4. Implement lazy loading
5. Minify CSS/JS
6. Test all animations
7. Cross-browser testing
8. Accessibility audit
9. SEO final check
10. Update documentation

---

## Dependencies

Already installed:
- `next` - Framework
- `react` - UI library
- `framer-motion` - Animations
- `tailwindcss` - Styling

Need to install:
```bash
npm install next/image  # Already in Next.js
npm install @next/font  # Already in Next.js
# No additional dependencies needed!
```

Optional:
```bash
npm install react-intersection-observer  # For scroll animations (alternative to Framer Motion)
npm install sharp  # Image optimization (auto-installed by Next.js)
```

---

## Performance Optimization

### Image Optimization
- Use Next.js `<Image>` component
- WebP format untuk modern browsers
- Responsive images dengan `sizes` prop
- Lazy loading untuk below-fold images
- Priority loading untuk hero image

### Code Splitting
- Server Components by default (zero JS bundle)
- Client Components only where needed (animations, interactivity)
- Lazy load mobile menu
- Dynamic imports untuk heavy components

### CSS Optimization
- Critical CSS inlined
- Tailwind purge unused classes
- Minimal custom CSS
- CSS modules untuk scoped styles

### Font Optimization
- Use `next/font` untuk optimal font loading
- Subset fonts (Latin characters only)
- Preload critical fonts
- Font display: swap

---

## SEO Checklist

- [x] **Meta Tags:**
  - Title (<60 chars)
  - Description (150-160 chars)
  - Keywords
  - Canonical URL
  - Viewport meta tag

- [x] **Open Graph:**
  - og:title
  - og:description
  - og:image (1200x630)
  - og:type
  - og:locale (id_ID)

- [x] **Twitter Card:**
  - twitter:card
  - twitter:title
  - twitter:description
  - twitter:image

- [x] **Structured Data:**
  - Organization schema
  - WebSite schema
  - SoftwareApplication schema

- [x] **Technical SEO:**
  - Semantic HTML (h1, h2, header, nav, main, footer)
  - Alt text pada images
  - Clean URL structure
  - robots.txt
  - sitemap.xml (future)
  - Fast loading (Lighthouse 90+)
  - Mobile-friendly
  - HTTPS (Vercel default)

---

## Accessibility Checklist (WCAG 2.2 AA)

- [x] **Keyboard Navigation:**
  - All interactive elements accessible via Tab
  - Focus indicators visible
  - Skip to main content link
  - No keyboard traps

- [x] **Screen Reader:**
  - ARIA labels pada interactive elements
  - Alt text pada images
  - Semantic HTML structure
  - Heading hierarchy (h1 → h2 → h3)
  - Link text descriptive (no "click here")

- [x] **Visual:**
  - Color contrast ratio ≥ 4.5:1 (normal text)
  - Color contrast ratio ≥ 3:1 (large text)
  - No reliance on color alone
  - Focus indicators ≥ 3:1 contrast
  - Text resizable up to 200%

- [x] **Forms (future):**
  - Labels associated dengan inputs
  - Error messages clear
  - Required fields indicated

- [x] **Motion:**
  - Respect prefers-reduced-motion
  - No auto-playing videos
  - Pause controls untuk animations

---

## Content Guidelines

### Headlines
- Clear, benefit-focused
- Action-oriented
- Emotive language (transformasi, modern, efisien)
- Indonesian language, professional tone

### Body Copy
- Short paragraphs (2-3 lines)
- Bullet points untuk easy scanning
- Benefits > Features
- Active voice
- No jargon

### CTAs
- Action verbs ("Mulai", "Coba", "Pelajari")
- Urgency indicators ("Sekarang", "Gratis")
- Value proposition ("Transformasi", "Demo Gratis")

---

## Time Estimate

- Phase 1 (Setup & Layout): 1 hour
- Phase 2 (Reusable Components): 1-2 hours
- Phase 3 (Hero Section): 1-2 hours
- Phase 4 (Features Section): 1-2 hours
- Phase 5 (About Section): 1-2 hours
- Phase 6 (CTA Section): 30 min
- Phase 7 (Mobile Menu): 1 hour
- Phase 8 (SEO & Metadata): 1 hour
- Phase 9 (Images & Assets): 1-2 hours
- Phase 10 (Polish & Optimization): 2-3 hours

**Total: 11-17 hours**

With testing, cross-browser verification, and content creation, expect **14-20 hours** total.

---

## Design Preview

Landing page akan implement design dari HTML reference dengan:
- ✅ Hero dengan gradient headline dan CTA buttons
- ✅ Floating animated card element
- ✅ Mini stats bar (social proof)
- ✅ 5 feature cards dalam responsive grid
- ✅ Large gradient feature card
- ✅ About section dengan image grid
- ✅ Trust indicators (avatar stack)
- ✅ CTA section dengan gradient background
- ✅ Professional footer
- ✅ Fixed header dengan backdrop blur
- ✅ Mobile hamburger menu
- ✅ Smooth scroll animations
- ✅ Hover effects dan transitions
- ✅ Material Symbols icons consistent
- ✅ Inter font throughout

---

## Next Steps After This Phase

After Phase 0A completion:
1. **Phase 0B: Auth & Login** - Authentication system (can be parallel)
2. **Phase 1: Database Schema** - Setup Prisma models
3. **Phase 2: Dashboard Layout** - Protected area dengan sidebar
4. Add more marketing pages (optional):
   - `/fitur` - Detailed features page
   - `/tentang` - About company/team page
   - `/kontak` - Contact form
   - `/harga` - Pricing page (future)

---

## Marketing Considerations

### Conversion Optimization
- Clear value proposition above fold
- Multiple CTAs throughout page
- Social proof (stats, testimonials)
- Trust indicators (security, testimonials)
- Reduce friction (one-click to login)

### A/B Testing (Future)
- Headlines variants
- CTA button text
- Hero image alternatives
- Feature order
- Color schemes

### Analytics Events (Future)
- Page view
- CTA clicks
- Section scroll depth
- Time on page
- Bounce rate
- Login button clicks

---

**Ready to build a landing page that converts! 🚀**
