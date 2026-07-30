# IB Practice Recovery

This release keeps strict student course isolation unchanged while adding a protected staff-only compatibility path when the new strict practice API is temporarily unavailable.

- Students never fall back to the legacy course endpoint.
- Teachers and administrators may continue reviewing mapped IB rows through the existing authenticated private-bank service.
- The interface explicitly labels recovery mode and does not claim withheld-row visibility while the strict API is unavailable.
- The deployment marker forces `practice-bank-api` to redeploy and pass its health check after merge.
