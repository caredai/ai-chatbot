import { Link } from "@tanstack/react-router";

export function NotFoundComponent() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          Oops, you seem to be lost in the cosmos
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you're looking for seems to have drifted off into the void.
          Don't worry, we'll help you find your way back.
        </p>
        <div className="mt-6">
          <Link
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            to="/chat"
          >
            Take me back to Earth
          </Link>
        </div>
      </div>
    </div>
  );
}
