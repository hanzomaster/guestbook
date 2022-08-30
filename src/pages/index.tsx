import type { NextPage } from "next"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { trpc } from "../utils/trpc"

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [email, setemail] = useState("");
  const ctx = trpc.useContext();
  const postMessage = trpc.useMutation("guestbookpostMessage", {
    onMutate: () => {
      ctx.cancelQuery(["guestbookgetAll"]);

      const optimisticUpdate = ctx.getQueryData(["guestbookgetAll"]);

      if (optimisticUpdate) {
        ctx.setQueryData(["guestbookgetAll"], optimisticUpdate);
      }
    },
    onSettled: () => {
      ctx.invalidateQueries(["guestbookgetAll"]);
    },
  });

  if (status === "loading") {
    return <main className="flex flex-col items-center pt-4">Loading...</main>;
  }

  return (
    <main className="flex flex-col items-center">
      <h1 className="pt-4 text-3xl">Guestbook</h1>
      <div className="pt-10">
        {session ? (
          <div>
            <p>Welcome, {session.user?.name}</p>
            <button onClick={() => signOut()}>Logout</button>

            <div className="pt-6">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();

                  postMessage.mutate({
                    name: session.user?.name as string,
                    message,
                  });

                  setMessage("");
                }}
              >
                <input
                  type="text"
                  value={message}
                  placeholder="Your message..."
                  maxLength={100}
                  onChange={(event) => setMessage(event.target.value)}
                  className="px-4 py-2 border-2 rounded-md border-zinc-800 bg-neutral-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2 border-2 rounded-md border-zinc-800 focus:outline-none"
                >
                  Submit
                </button>
              </form>
            </div>

            <div className="pt-10" />
            <Messages />
          </div>
        ) : (
          <div>
            <button onClick={() => signIn("discord")}>
              Login with Discord
            </button>
            <br />
            <button onClick={() => signIn("google")}>Login with Google</button>
            <br />
            <button onClick={() => signIn("github")}>Login with Github</button>
            <br />
            <form
              className="flex border border-slate-200 rounded-xl w-[400px]"
              aria-label="simple-form"
              onSubmit={(e) => {
                e.preventDefault();
                console.log(email);
                if (!email) return false;

                signIn("email", { email, redirect: false });
              }}
            >
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter your content"
                  className="w-full p-3 bg-transparent outline-none"
                  onChange={(e) => setemail(e.target.value)}
                />
              </div>
              <button className="flex-shrink-0 p-3 font-bold text-white bg-blue-500 rounded-xl">
                Login
              </button>
            </form>
            <div className="pt-10" />
            <Messages />
          </div>
        )}
      </div>
    </main>
  );
};

const Messages = () => {
  const { data: messages, isLoading } = trpc.useQuery(["guestbookgetAll"]);

  if (isLoading) {
    return <div>Fetching messages...</div>;
  }

  if (!messages || messages.length === 0) {
    return <div>No messages yet</div>;
  }

  return (
    <div>
      {messages.map((msg, index) => {
        return (
          <div key={index}>
            <p>{msg.message}</p>
            <span>- {msg.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default Home;
