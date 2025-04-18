// SPDX-FileCopyrightText: 2023 Dash0 Inc.
// SPDX-License-Identifier: Apache-2.0

import Logo from "./assets/svg/otelbin_logo_white.svg";
import { LogIn } from "lucide-react";
import { Share } from "~/components/share/Share";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "~/components/button";
import ValidationType from "./validation-type/ValidationType";

export default function AppHeader() {
	return (
		<div className="flex shrink-0 items-center justify-between border-b-1 border-subtle bg-neutral-150 px-4 py-3">
			<div className="flex items-center gap-x-4">
				<div className="flex items-center gap-x-2">
					<Logo height={22} />
					<p className="text-md font-bold text-neutral-950">OTelBin</p>
				</div>

				<div className="w-px bg-neutral-350 h-full">&nbsp;</div>

				<ValidationType />
			</div>
			<div className="flex gap-x-2">
				<Share />

				<SignedIn>
					<UserButton
						appearance={{
							elements: {
								avatarBox: "w-6 h-6",
							},
						}}
					/>
				</SignedIn>
				<SignedOut>
					<SignInButton mode="modal" forceRedirectUrl="/restore">
						<Button size="xs">
							<LogIn />
						</Button>
					</SignInButton>
				</SignedOut>
			</div>
		</div>
	);
}
