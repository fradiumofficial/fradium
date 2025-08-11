# 🎨 FRADIUM Design System

Font Utama: **General Sans**

---

## 1. Typography

**Font Family:**

- `General Sans` (by Indian Type Foundry)

**Hierarchy:**

| Style       | Font Size | Weight   | Line Height | Usage                                     |
| ----------- | --------- | -------- | ----------- | ----------------------------------------- |
| Heading 1   | 64px      | Bold     | 120%        | Hero title (“Protect every transaction…”) |
| Heading 2   | 48px      | Semibold | 120%        | Section titles                            |
| Subtitle    | 20px      | Medium   | 150%        | Section caption                           |
| Body Text   | 16px      | Regular  | 150%        | Main body copy                            |
| Caption     | 14px      | Medium   | 140%        | Description, tags                         |
| Button Text | 16px      | Semibold | 130%        | CTA buttons                               |

---

## 2. Color Palette

### Primary Colors

| Name          | Hex       | Usage                 |
| ------------- | --------- | --------------------- |
| Primary Green | `#9BEB83` | CTA Buttons           |
| Accent Purple | `#A259FF` | Button shadow, accent |
| Soft Black    | `#0C0D14` | Background            |
| White         | `#FFFFFF` | Text and icons        |

### Support Colors

| Name        | Hex       | Usage           |
| ----------- | --------- | --------------- |
| Bright Pink | `#FF2C9C` | Decorative      |
| Neon Blue   | `#2CDDFE` | Decorative      |
| Yellow      | `#FFD74B` | Icon, highlight |
| Cyan        | `#00F0FF` | Space elements  |

---

## 3. Buttons

### Primary Button

- Font: General Sans, 16px, Semibold
- Text Color: `#0C0D14`
- Background: `#9BEB83`
- Padding: `12px 24px`
- Border Radius: `8px`
- Shadow: `4px offset` with `#A259FF`

### Button States

| State    | Background | Text Color | Shadow        |
| -------- | ---------- | ---------- | ------------- |
| Default  | `#9BEB83`  | `#0C0D14`  | Purple offset |
| Hover    | `#83D36F`  | `#0C0D14`  | Slight blur   |
| Disabled | `#D7ECD0`  | `#999999`  | None          |

---

## 4. Spacing System

Menggunakan sistem grid 8pt:

| Name | Size | Usage            |
| ---- | ---- | ---------------- |
| XS   | 4px  | Icon padding     |
| S    | 8px  | Button padding   |
| M    | 16px | Antarkomponen    |
| L    | 32px | Section spacing  |
| XL   | 64px | Hero/top section |

---

## 5. Iconography & Illustration

- **Gaya ilustrasi**: Hand-drawn psychedelic space art
- **Warna**: Cerah dan neon
- **Style**: Outline putih dengan kanvas gelap
- **Icon**: Tidak menggunakan SVG minimalis, semua custom vector

---

## 6. Navigation Bar

- **Logo**: Text + icon, warna putih
- **Nav Items**: General Sans, 16px, Medium, putih
- **CTA Button**: `Sign In` menggunakan style button primary

---

## 7. Hero Section

- **Background**: `#0C0D14`
- **Title**: Heading 1, centered, putih
- **Subtitle**: Subtitle text, centered
- **CTA Button**: `Launch Wallet` dengan shadow ungu

---

## 8. Component Naming (Figma)

| Component Name   | Description            |
| ---------------- | ---------------------- |
| `Button/Primary` | Launch Wallet, Sign In |
| `Text/HeroTitle` | Hero headline text     |
| `Nav/MenuItem`   | Navigation items       |
| `Illustration/*` | Semua ilustrasi custom |
| `Layout/Hero`    | Container hero section |

---

> Catatan: Semua teks menggunakan `General Sans`. Gunakan kontras tinggi pada elemen di atas background gelap untuk memastikan aksesibilitas.
