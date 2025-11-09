import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Stethoscope, User, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
              <span className="text-sm font-medium text-white">AI-Powered Orthodontic Analysis</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl lg:text-7xl">
              OrthoDoc AI
            </h1>
            
            <p className="mb-12 text-xl text-white/90 md:text-2xl">
              Smart orthodontic care for doctors and patients
            </p>

            <div className="flex flex-col gap-6 sm:flex-row sm:justify-center">
              <Link to="/auth/login?role=doctor">
                <Button size="lg" variant="secondary" className="group w-full sm:w-auto">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  I'm a Doctor
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/auth/login?role=patient">
                <Button size="lg" variant="outline" className="w-full border-white bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto">
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

      {/* Features Section */}
      <section className="py-20 px-4">
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
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
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
    title: 'AI Analysis',
    description: 'Upload dental images and get instant AI-powered analysis with precise measurements and recommendations.',
  },
  {
    icon: Stethoscope,
    title: 'Doctor Portal',
    description: 'Manage patients, review cases, approve treatment plans, and customize braces all in one place.',
  },
  {
    icon: User,
    title: 'Patient Portal',
    description: 'Track your treatment progress, customize your braces, and book appointments with ease.',
  },
];

export default Landing;
