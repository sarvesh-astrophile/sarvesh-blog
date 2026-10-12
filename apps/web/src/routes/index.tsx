import { Button } from "@sarvesh-blog/ui/components/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sarvesh-blog/ui/components/input-group";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  CirclePlus,
  Play,
  Plus,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersVertical,
  Sparkles,
  Sun,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sarvesh Kumar — Resume" },
      {
        name: "description",
        content: "Sarvesh Kumar, Forward Deployed Engineer at Artizent. Selected clients and work.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Merriweather:wght@300&display=swap",
      },
    ],
  }),
  component: HomePage,
});

const companies = [
  { name: "InterviewFlow AI", description: "AI interview software", image: "interviewflow.png" },
  { name: "Tranquil Decor", description: "Interior design & Home Decor", image: "tranquil.jpg" },
  { name: "Odva", description: "Testing and remediation for AI agents", image: "odva.png" },
  {
    name: "iGamingSA",
    description: "Sports betting affiliate in South Africa",
    image: "igamingsa.png",
  },
  { name: "Johar Basket", description: "Quick Commerce for Hazaribagh", image: "johar.png" },
  { name: "Elcass AI", description: "AI powered learning platform", image: "elcass.png" },
  { name: "Guha Research Conference", description: "Research Conference", image: "guha.png" },
  { name: "Entity SEO", description: "SEO based on entity tracking", image: "entity.png" },
  { name: "RMC Education", description: "Study abroad consultancy", image: "rmc.png" },
];

const suggestions = [
  "How many product he has build ?",
  "What is the tech stack he mainly uses",
  "What is the average charge for any project ?",
  "How many product he has build ?",
];

function preview(feature: string) {
  toast.info(`${feature} is a frontend preview and isn't connected yet.`);
}

const navigationButtonClass =
  "h-auto justify-start rounded-sm p-0 text-base leading-6 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground";
const iconButtonClass = "size-5 rounded-sm p-0 text-muted-foreground";

function HomePage() {
  const [time, setTime] = useState("— IST");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    const updateTime = () =>
      setTime(
        `${new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date())} IST`,
      );
    updateTime();
    const interval = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-h-svh bg-background font-[Geist,sans-serif] text-base leading-5 text-foreground antialiased">
      <div className="sm:grid sm:min-h-[calc(100svh-76px)] sm:grid-cols-[170px_minmax(0,704px)] sm:justify-center min-[1000px]:min-h-[1100px] min-[1000px]:grid-cols-[minmax(170px,calc((100%-704px)/2+16px))_704px_minmax(0,1fr)]">
        <aside className="flex justify-start px-5 pt-6 sm:justify-end sm:px-4 sm:py-16">
          <nav
            aria-label="Portfolio navigation"
            className="flex w-full flex-row flex-wrap items-center gap-x-4 gap-y-2 sm:w-[138px] sm:flex-col sm:items-start sm:gap-1"
          >
            <Sun className="size-5" aria-hidden="true" />
            <Button
              variant="ghost"
              className={`${navigationButtonClass} font-medium text-foreground`}
              render={<Link to="/" aria-current="page" />}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              className={navigationButtonClass}
              onClick={() => preview("Resume")}
            >
              Resume
            </Button>
            <Button
              variant="ghost"
              className={navigationButtonClass}
              onClick={() => preview("Blog")}
            >
              Blog
            </Button>
            <Button
              variant="ghost"
              className={navigationButtonClass}
              onClick={() => preview("All Works")}
            >
              All Works
            </Button>
            {["AI Skills", "Design Skills", "ML Skills", "Marketing Skills"].map((skill) => (
              <Button
                variant="ghost"
                className={`${navigationButtonClass} gap-1 text-sm sm:text-base`}
                key={skill}
                onClick={() => preview(skill)}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
                {skill}
              </Button>
            ))}
            <div className="flex w-auto justify-end gap-2 text-muted-foreground sm:w-full sm:py-1.5">
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                aria-label="LinkedIn preview"
                onClick={() => preview("LinkedIn")}
              >
                <svg
                  className="size-5"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="2" y="9" width="4" height="13" rx="1" />
                  <circle cx="4" cy="4" r="2" />
                  <path d="M10 22V9h4v2c1-2 8-4 8 4v7h-4v-7c0-3-4-3-4 0v7Z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                aria-label="GitHub preview"
                onClick={() => preview("GitHub")}
              >
                <svg
                  className="size-5"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 22v-4c-4 1-5-2-7-3M15 22v-4c0-1-.3-2-1-2 5-.5 7-3 7-6 0-2-.5-3-1-4 .5-1 .5-3 0-4-2 0-3 1-4 2-3-1-5-1-8 0-1-1-2-2-4-2-.5 1-.5 3 0 4-1 1-1 2-1 4 0 3 2 5.5 7 6-1 0-1 1-1 2" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                aria-label="X preview"
                onClick={() => preview("X")}
              >
                <svg
                  className="size-5"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M3 21 21 3M8 3H3l13 18h5L8 3Z" />
                </svg>
              </Button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-5 pt-8 pb-12 sm:px-6 sm:py-16 min-[1000px]:px-8">
          <div className="mb-5 flex min-h-[39px] items-start justify-between gap-4 text-sm leading-[21px] sm:mb-0">
            <div>
              Bengaluru, India<time className="block text-xs leading-[18px]">{time}</time>
            </div>
            <Button
              className="h-auto gap-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs leading-[21px] font-normal text-white hover:bg-blue-700 sm:px-3 sm:text-sm"
              onClick={() => preview("Newsletter subscription")}
            >
              Subscribe to newsletter <ArrowRight className="size-4 sm:size-5" aria-hidden="true" />
            </Button>
          </div>

          <section className="flex flex-col items-center gap-5" aria-labelledby="resume-name">
            <img
              className="h-[231px] w-[188px] object-cover"
              src="/resume/portrait.png"
              width={188}
              height={231}
              alt="Portrait of Sarvesh Kumar as a sculpted bust wearing sunglasses"
            />
            <div className="text-center">
              <h1
                id="resume-name"
                className="font-[Merriweather,serif] text-3xl leading-[45px] font-light"
              >
                Sarvesh Kumar
              </h1>
              <Button
                variant="link"
                onClick={() => preview("Music playback")}
                className="h-auto p-0 text-base leading-5 font-normal text-blue-700 dark:text-blue-400"
              >
                /* let me play a song */
              </Button>
            </div>
            <p className="self-stretch">
              I am a Forward Deployed Engineer (FDE) @ Artizent. previously I ran reetlab - a
              conversion based design studio for small teams and solo founders
            </p>
            <p className="self-stretch">I have been freelancing for 2 years.</p>
            <section className="w-full" aria-labelledby="resume-companies-title">
              <h2 id="resume-companies-title" className="mb-2 text-base font-normal">
                Companies I have work with:
              </h2>
              <ul className="flex flex-col gap-2">
                {companies.map((company) => (
                  <li key={company.name} className="flex items-start gap-1">
                    <span
                      className={`flex h-5 shrink-0 items-center ${company.image === "rmc.png" ? "w-[38px]" : "w-5"}`}
                    >
                      <img
                        className={`rounded-sm object-contain ${company.image === "rmc.png" ? "h-[13px] w-[38px]" : "size-5"}`}
                        src={`/resume/${company.image}`}
                        width={20}
                        height={20}
                        alt=""
                      />
                    </span>
                    <span>
                      <strong className="font-medium">{company.name}</strong>
                      <span className="text-muted-foreground"> / {company.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </section>

          <section
            className="mt-8 flex flex-col gap-4 border-t border-border py-4"
            aria-labelledby="resume-questions-title"
          >
            <h2 id="resume-questions-title" className="text-lg leading-[23px] font-medium">
              What do you want to know ?
            </h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                preview("AI questions");
              }}
            >
              <InputGroup className="h-auto rounded-sm border-border bg-muted p-2">
                <InputGroupAddon className="p-0">
                  <Plus className="size-5" aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  className="h-auto text-base md:text-base"
                  aria-label="Ask a question about Sarvesh"
                  placeholder="Ask anything about him ..."
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
                <InputGroupAddon align="inline-end" className="p-0">
                  <InputGroupButton
                    variant="default"
                    type="submit"
                    className="h-auto gap-2 rounded-full px-2.5 py-1 text-sm leading-[21px] font-normal"
                  >
                    Ask AI <Sparkles size={16} aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  variant="outline"
                  className="h-auto gap-2 rounded-sm border-dashed bg-muted px-2 py-1 text-left text-sm leading-[17.5px] font-normal whitespace-normal text-muted-foreground hover:border-muted-foreground"
                  key={`${suggestion}-${index}`}
                  onClick={() => setQuestion(suggestion)}
                >
                  {suggestion}
                  <CirclePlus className="size-3.5" aria-hidden="true" />
                </Button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <footer
        className="bg-background px-5 pt-5 pb-2 shadow-sm sm:px-6"
        aria-label="Music player preview"
      >
        <div className="mx-auto flex max-w-[640px] items-center">
          <div className="flex items-center gap-2 text-xs leading-[15px]">
            <div className="size-12 shrink-0 bg-[#c96254]" />
            <div>
              Ocean<span className="block text-muted-foreground">Fisher</span>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm p-0 text-muted-foreground"
              aria-label="Previous track"
              onClick={() => preview("Music playback")}
            >
              <SkipBack className="size-6" fill="currentColor" />
            </Button>
            <Button
              size="icon"
              className="size-5 rounded-full p-0"
              aria-label="Play Ocean (preview)"
              onClick={() => preview("Music playback")}
            >
              <Play className="size-3" fill="currentColor" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm p-0 text-muted-foreground"
              aria-label="Next track"
              onClick={() => preview("Music playback")}
            >
              <SkipForward className="size-6" fill="currentColor" />
            </Button>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm p-0 text-muted-foreground"
              aria-label="Audio settings"
              onClick={() => preview("Audio settings")}
            >
              <SlidersVertical className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm p-0 text-muted-foreground"
              aria-label="Shuffle"
              onClick={() => preview("Shuffle")}
            >
              <Shuffle className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 rounded-sm p-0 text-muted-foreground"
              aria-label="Volume"
              onClick={() => preview("Volume")}
            >
              <Volume2 className="size-6" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
