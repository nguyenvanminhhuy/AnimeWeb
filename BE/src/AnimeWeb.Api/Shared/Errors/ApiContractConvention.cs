using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Routing;

namespace AnimeWeb.Api.Shared.Errors;

public sealed class ApiContractConvention : IApplicationModelConvention
{
    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers.Where(x => x.ControllerType.Assembly == typeof(ApiContractConvention).Assembly))
            foreach (var action in controller.Actions)
            {
                var responses = action.Attributes.OfType<ProducesResponseTypeAttribute>()
                    .Concat(action.Filters.OfType<ProducesResponseTypeAttribute>()).ToArray();
                if (!responses.Any(x => x.StatusCode is >= 200 and < 300))
                {
                    var type = action.ActionMethod.ReturnType;
                    if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(Task<>)) type = type.GenericTypeArguments[0];
                    if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(ActionResult<>)) type = type.GenericTypeArguments[0];
                    if (type != typeof(void) && type != typeof(Task) && !typeof(IActionResult).IsAssignableFrom(type))
                        action.Filters.Add(new ProducesResponseTypeAttribute(type, 200));
                }
                void Add(int status)
                {
                    if (!action.Attributes.OfType<ProducesResponseTypeAttribute>().Concat(action.Filters.OfType<ProducesResponseTypeAttribute>())
                        .Any(x => x.StatusCode == status))
                        action.Filters.Add(new ProducesResponseTypeAttribute(typeof(ApiErrorResponse), status));
                }
                if (action.Parameters.Any(x => x.ParameterInfo.ParameterType != typeof(CancellationToken))) Add(400);
                var attributes = controller.Attributes.Concat(action.Attributes).ToArray();
                if (attributes.OfType<IAuthorizeData>().Any() && !attributes.OfType<IAllowAnonymous>().Any()) { Add(401); Add(403); }
                if (action.Attributes.OfType<HttpMethodAttribute>().Any(x => x.HttpMethods.Any(m => m != "GET"))) Add(409);
                if (action.Parameters.Any(x => x.ParameterName is "id" or "animeId" or "seasonId" or "episodeId" or "slug")) Add(404);
            }
    }
}
