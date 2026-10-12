"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "./ui"
import { hero } from "@/lib/media"
import { site, whatsappLink } from "@/lib/site"

/**
 * Full-bleed campaign hero. The photo renders first (fast, and it's the LCP image);
 * the video fades in over it only once it is actually playing, and never for
 * visitors who ask for reduced motion or are on data saver.
 */
export default function Hero() {
  const [allowVideo, setAllowVideo] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const saveData = (navigator as any).connection?.saveData === true
    setAllowVideo(!reduce && !saveData && Boolean(hero.video))
  }, [])

  return (
    <section
      aria-label="DS Wardrobe"
      className="relative left-1/2 -mt-6 h-[78svh] min-h-[520px] w-screen -translate-x-1/2 overflow-hidden bg-ink lg:h-[88svh]"
    >
      <Image src={hero.poster} alt={hero.posterAlt} fill priority sizes="100vw" className="object-cover" />

      {allowVideo && (
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${playing ? "opacity-100" : "opacity-0"}`}
          src={hero.video}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          onPlaying={() => setPlaying(true)}
          onError={() => setAllowVideo(false)}
        />
      )}

      {/* Legibility: darken the lower-left where the type sits, leave the clothes visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/50 to-transparent" />

      <div className="container-page relative flex h-full flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
        <h1 className="hero-rise max-w-4xl font-display text-[3.25rem] leading-[0.95] text-paper sm:text-7xl lg:text-[7.5rem]">
          Your style is your personal brand.
        </h1>
        <div className="hero-rise hero-rise-late mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-sm text-paper/85">
            {site.subline} Shirts, tees and pants from {site.location}, shipped across India.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/shop" variant="light">Shop now</Button>
            <Button href={whatsappLink("Hi DS Wardrobe! I'd like to place an order.")} variant="lightOutline">
              Order on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
