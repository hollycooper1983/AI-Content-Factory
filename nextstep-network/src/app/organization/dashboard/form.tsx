"use client";

import { useFormState } from "react-dom";
import { saveOrganization } from "@/app/actions/admin";
import { FormMessage, SubmitButton } from "@/components/client-ui";

export function OrgForm({ org }: { org: { name: string; description: string; website: string; location: string } | null }) {
  const [state, action] = useFormState(saveOrganization, undefined);
  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
      <div><label className="label" htmlFor="oname">Name</label><input id="oname" name="name" defaultValue={org?.name} className="input" required /></div>
      <div><label className="label" htmlFor="oloc">Location</label><input id="oloc" name="location" defaultValue={org?.location} className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="oweb">Official website (https)</label><input id="oweb" name="website" type="url" defaultValue={org?.website} className="input" /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="odesc">Description</label><textarea id="odesc" name="description" rows={4} defaultValue={org?.description} className="input" /></div>
      <div className="flex items-center gap-2 sm:col-span-2"><SubmitButton>Save</SubmitButton><FormMessage state={state} /></div>
    </form>
  );
}
