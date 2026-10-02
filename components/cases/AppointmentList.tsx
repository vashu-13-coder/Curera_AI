import type { Appointment } from "@/types"

export default function AppointmentList({
  appointments,
}: {
  appointments: Appointment[]
}) {
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3" aria-labelledby="appointments-title">
      <div>
        <h2 id="appointments-title" className="font-semibold">Appointments</h2>
        <p className="text-sm text-muted-foreground">
          Appointment details shared for this case.
        </p>
      </div>

      {appointments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No appointment has been scheduled.</p>
      ) : (
        <ul className="space-y-3">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="rounded-md bg-muted/50 p-3 text-sm">
              <time dateTime={appointment.scheduled_at} className="font-medium">
                {new Date(appointment.scheduled_at).toLocaleString()}
              </time>
              {appointment.notes && (
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {appointment.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
