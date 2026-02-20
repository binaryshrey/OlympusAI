import { withAuth } from "@workos-inc/authkit-nextjs";
import OnboardForm from "../components/OnboardForm";
import ProfileMenu from "../components/ProfileMenu";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperTitle,
  StepperTrigger,
} from "../components/ui/stepper";

const steps = [
  { title: "Setup" },
  { title: "Onboard" },
  { title: "PM Meeting" },
  { title: "Review" },
  { title: "AI Agents Workflow" },
  { title: "Preview" },
];

export default async function Onboard() {
  const { user } = await withAuth();

  if (!user) return null;

  return (
    <div className="relative z-10 min-h-screen bg-blue-100">
      <div className="px-6 pt-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <a href="/dashboard" className="-m-1.5 p-1.5">
            <img className="h-8" src="/logo.svg" alt="nebula-ai" />
          </a>
          <div className="lg:flex lg:flex-1 lg:justify-end">
            <ProfileMenu user={user} />
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <Stepper defaultValue={2} className="space-y-8">
          <StepperNav className="gap-3.5 mb-15">
            {steps.map((step, index) => {
              return (
                <StepperItem
                  key={index}
                  step={index + 1}
                  className="relative flex-1 items-start"
                >
                  <StepperTrigger className="flex flex-col items-start justify-center gap-3.5 grow pointer-events-none">
                    <StepperIndicator className="bg-white rounded-full h-1 w-full data-[state=active]:bg-primary"></StepperIndicator>
                    <div className="flex flex-col items-start gap-1">
                      <StepperTitle className="text-start font-semibold group-data-[state=inactive]/step:text-muted-foreground">
                        {step.title}
                      </StepperTitle>
                    </div>
                  </StepperTrigger>
                </StepperItem>
              );
            })}
          </StepperNav>
        </Stepper>

        <OnboardForm user={user} />
      </div>
    </div>
  );
}
