import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import s1 from "@/assets/s1.jpg";
import s2 from "@/assets/s2.jpg";
import s3 from "@/assets/s3.jpg";
import s4 from "@/assets/s4.webp";
import s6 from "@/assets/s6.jpg";

const gallery = [s1, s2, s3, s4, s6];

const statBlocks = [
  { label: "AI case intake", value: "Structured" },
  { label: "Treatment tracking", value: "Visible" },
  { label: "Care access", value: "Doctor and patient" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI Analysis",
    description: "Upload an image and get a structured orthodontic assessment with a clear next step.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Workflow",
    description: "Track patients, manage appointments, and review cases without jumping between tools.",
  },
  {
    icon: User,
    title: "Patient Experience",
    description: "See your progress, book follow-ups, and manage your treatment history in one place.",
  },
];

const GalleryPreview = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % gallery.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card className="relative overflow-hidden border-white/20 bg-white/10 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.2)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
      <div className="relative grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-2xl">
          {gallery.map((image, imageIndex) => (
            <img
              key={image}
              src={image}
              alt={`OrthoDoc preview ${imageIndex + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                imageIndex === index
                  ? "translate-x-0 opacity-100"
                  : imageIndex < index
                    ? "-translate-x-8 opacity-0"
                    : "translate-x-8 opacity-0"
              }`}
              draggable={false}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-white backdrop-blur-md">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Live workflow</p>
                <p className="text-sm font-medium">Analyze cases, coordinate care, and schedule follow-ups</p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {statBlocks.map((block) => (
              <div key={block.label} className="rounded-2xl border border-border/70 bg-background/90 p-4 text-foreground shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{block.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{block.value}</p>
              </div>
            ))}
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {gallery.map((image, imageIndex) => (
              <button
                key={image}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className={`overflow-hidden rounded-2xl border transition-all ${
                  imageIndex === index
                    ? "border-white/40 ring-2 ring-white/40"
                    : "border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={image} alt={`Preview thumbnail ${imageIndex + 1}`} className="h-24 w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-4 pb-20 pt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.18),_transparent_30%),radial-gradient(circle_at_top_right,_hsl(var(--secondary)/0.16),_transparent_24%),linear-gradient(to_bottom_right,_hsl(var(--background)),_hsl(var(--background)))]" />
        <div className="absolute left-8 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-4 top-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

        <div className="container relative mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                AI-powered orthodontic care
              </div>

              <div className="space-y-4">
                <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground md:text-6xl lg:text-7xl">
                  Clinical workflows that feel fast, clear, and calm.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
                  OrthoDoc AI brings patient records, X-ray analysis, appointments, and treatment planning into one focused workspace.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/auth/login?role=doctor">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    <Stethoscope className="h-5 w-5" />
                    Doctor Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth/login?role=patient">
                  <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                    <User className="h-5 w-5" />
                    Patient Sign In
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "X-ray review queue",
                  "Brace planning tools",
                  "Appointments and cases",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border bg-card/80 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur">
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <GalleryPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Why teams use it</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Less friction in the clinic. More clarity for the patient.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <Card className="group h-full border-border/60 bg-card/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
