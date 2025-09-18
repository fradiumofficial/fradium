from enum import Enum
from uagents import Context, Model
from uagents.experimental.quota import QuotaProtocol


def agent_is_healthy() -> bool:
    """
    Implement the actual health check logic here.

    For example, check if the agent can connect to a third party API,
    check if the agent has enough resources, etc.
    """
    condition = True  # TODO: logic here
    return bool(condition)

class HealthCheck(Model):
    pass

class HealthStatus(str, Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"

class AgentHealth(Model):
    agent_name: str
    status: HealthStatus


def create_health_protocol(agent, agent_name: str) -> QuotaProtocol:
    health_protocol = QuotaProtocol(
        storage_reference=agent.storage, name="HealthProtocol", version="0.1.0"
    )

    @health_protocol.on_message(HealthCheck, replies={AgentHealth})
    async def handle_health_check(ctx: Context, sender: str, msg: HealthCheck):
        status = HealthStatus.UNHEALTHY
        try:
            if agent_is_healthy():
                status = HealthStatus.HEALTHY
        except Exception as err:
            ctx.logger.error(err)
        finally:
            await ctx.send(sender, AgentHealth(agent_name=agent_name, status=status))

    return health_protocol