import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Stethoscope, User, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

// Add your images here (import or use URLs)
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import s3 from "@/assets/s3.jpg";
import s4 from "@/assets/s4.webp";
import s6 from "@/assets/s6.jpg";

const sliderImages = [s1, s2, s3, s4, s6];

const ImageSlider = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % sliderImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto flex w-full max-w-xl flex-col items-center justify-center py-10">
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-white/10 shadow-2xl">
        {sliderImages.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`slide-${i}`}
            className={`absolute left-0 top-0 h-full w-full object-cover transition-transform duration-700 ease-in-out ${
              i === index
                ? "translate-x-0 opacity-100 z-10"
                : i < index
                ? "-translate-x-full opacity-0 z-0"
                : "translate-x-full opacity-0 z-0"
            } shadow-lg`}
            draggable={false}
            style={{
              filter:
                i === index
                  ? "brightness(1) drop-shadow(0 4px 24px rgba(0,0,0,0.12))"
                  : "brightness(0.95)",
              transition: "filter 0.5s",
            }}
          />
        ))}
      </div>
      {/* Animated dots */}
      <div className="mt-8 flex gap-3">
        {sliderImages.map((_, i) => (
          <span
            key={i}
            className={`block h-2 w-2 rounded-full transition-all duration-300 ${
              i === index
                ? "scale-125 bg-primary shadow-lg"
                : "scale-100 bg-secondary/70 border border-secondary"
            }`}
            style={{
              boxShadow:
                i === index ? "0 0 8px 2px rgba(59,130,246,0.3)" : undefined,
              transition: "background 0.3s, transform 0.3s, box-shadow 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                AI-Powered Orthodontic Analysis
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              OrthoDoc AI
            </h1>

            <p className="mb-12 text-xl text-white/90 md:text-2xl">
              Smart orthodontic care for doctors and patients
            </p>

            <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
              <Link to="/auth/login?role=doctor">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group w-full sm:w-auto"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  I'm a Doctor
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/auth/login?role=patient">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                >
                  <User className="mr-2 h-5 w-5" />
                  I'm a Patient
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      </section>

      {/* Image Slider Section */}
      <section className="bg-background px-4">
        <ImageSlider />
      </section>

      {/* Features Section */}
      <section className="pt-5 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Advanced AI analysis for precise orthodontic assessments
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group h-full p-6 transition-all hover:shadow-lg">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    icon: Sparkles,
    title: "AI Analysis",
    description:
      "Upload dental images and get instant AI-powered analysis with precise measurements and recommendations.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Portal",
    description:
      "Manage patients, review cases, approve treatment plans, and customize braces all in one place.",
  },
  {
    icon: User,
    title: "Patient Portal",
    description:
      "Track your treatment progress, customize your braces, and book appointments with ease.",
  },
];

export default Landing;
