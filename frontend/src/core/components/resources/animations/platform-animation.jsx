

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Leaf, Users, Award, BarChart3 } from "lucide-react"

export default function PlatformAnimation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Particle system
    const particles = []
    const particleCount = 50

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5

        // Green shades for eco theme
        const colors = [
          "rgba(72, 187, 120, 0.2)", // green-500
          "rgba(56, 161, 105, 0.2)", // green-600
          "rgba(104, 211, 145, 0.2)", // green-400
          "rgba(154, 230, 180, 0.2)", // green-300
        ]
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        else if (this.x < 0) this.x = canvas.width

        if (this.y > canvas.height) this.y = 0
        else if (this.y < 0) this.y = canvas.height
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Animation loop
    const animate = () => {
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update particles
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(72, 187, 120, ${0.1 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return (
    <div className="relative h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <motion.div
            className="absolute -top-16 -left-16 bg-green-100 dark:bg-green-900/50 rounded-full p-3"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
          </motion.div>

          <motion.div
            className="absolute -top-12 -right-16 bg-blue-100 dark:bg-blue-900/50 rounded-full p-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
          >
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-16 -left-16 bg-amber-100 dark:bg-amber-900/50 rounded-full p-3"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.7 }}
          >
            <Award className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </motion.div>

          <motion.div
            className="absolute -bottom-12 -right-16 bg-purple-100 dark:bg-purple-900/50 rounded-full p-3"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
          >
            <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </motion.div>

          <motion.div
            className="bg-white dark:bg-gray-800 rounded-full h-32 w-32 flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <motion.div
              className="text-4xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent"
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              Lumora
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
